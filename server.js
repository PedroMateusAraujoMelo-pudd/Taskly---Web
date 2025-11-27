// server.js COMPLETO E CORRIGIDO
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const port = 3000;

// CONFIGURAÇÃO DA SESSÃO
app.use(session({
  secret: "chave-super-secreta",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 horas
}));

// CONEXÃO COM O BANCO
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco:", err.message);
  } else {
    console.log("Conectado ao banco de dados 'database.db'.");
    criarTabelas(); // Garante que as tabelas existam
  }
});
db.run('PRAGMA foreign_keys = ON;');

// FUNÇÃO PARA CRIAR AS TABELAS SE ELAS NÃO EXISTIREM
function criarTabelas() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
                usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS projetos (
                projeto_id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                descricao TEXT,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                usuario_id INTEGER NOT NULL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (usuario_id) ON DELETE CASCADE
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS tarefas (
                tarefa_id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descricao TEXT,
                concluida INTEGER DEFAULT 0,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_conclusao DATETIME,
                projeto_id INTEGER NOT NULL,
                FOREIGN KEY (projeto_id) REFERENCES projetos (projeto_id) ON DELETE CASCADE
            )
        `);
        console.log("Tabelas verificadas/criadas com sucesso.");
    });
}

// MIDDLEWARES
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// AUTENTICAÇÃO
function verificarLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).redirect('/login.html');
  }
  next();
}

// --- ROTAS DE PÁGINAS ---

app.get('/', (req, res) => res.redirect('/login.html'));

app.get('/index.html', verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// --- ROTAS DE CADASTRO E LOGIN ---

app.post('/cadastro', (req, res) => {
  const { nome, email, senha, confirmar_senha } = req.body;
  if (senha !== confirmar_senha) return res.redirect('/cadastro.html?erro=senhas');

  const hash = bcrypt.hashSync(senha, 10);
  
  // Tenta inserir o usuário
  db.run(`INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`, [nome, email, hash], function(err) {
      if (err) {
          console.error(err);
          return res.redirect('/cadastro.html?erro=email_existe');
      }
      
      const novoUserId = this.lastID;

      // Cria o projeto "Inbox" automaticamente para o novo usuário
      db.run(`INSERT INTO projetos (nome, descricao, usuario_id) VALUES (?, ?, ?)`, ['Inbox', 'Tarefas Individuais', novoUserId], (err) => {
        if(err) console.error("Erro ao criar Inbox:", err);
        res.redirect('/login.html?sucesso=1');
      });
  });
});

app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, user) => {
    if (err || !user || !bcrypt.compareSync(senha, user.senha)) {
      return res.redirect('/login.html?erro=login');
    }
    
    req.session.userId = user.usuario_id; 
    req.session.userName = user.nome;
    
    // Busca e configura o Inbox na sessão
    db.get(`SELECT projeto_id FROM projetos WHERE usuario_id = ? AND nome = 'Inbox'`, [user.usuario_id], (err, proj) => {
        if(proj) {
            req.session.inboxId = proj.projeto_id;
        } else {
            // Recuperação: Se usuário antigo logar e não tiver Inbox, cria agora
            db.run(`INSERT INTO projetos (nome, descricao, usuario_id) VALUES (?, ?, ?)`, ['Inbox', 'Tarefas Individuais', user.usuario_id], function(err){
                if(!err) req.session.inboxId = this.lastID;
            });
        }
        res.redirect('/index.html');
    });
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

// --- API (DADOS PARA O FRONTEND) ---

app.get('/api/data', verificarLogin, (req, res) => {
  const userId = req.session.userId;
  // Se por algum motivo o inboxId não estiver na sessão, tenta usar 0 ou trata no front
  const inboxId = req.session.inboxId || 0;

  const queryProjetos = `SELECT * FROM projetos WHERE usuario_id = ? AND projeto_id != ?`;
  const queryTarefas = `
    SELECT t.* FROM tarefas t
    JOIN projetos p ON t.projeto_id = p.projeto_id
    WHERE p.usuario_id = ?`;

  db.all(queryProjetos, [userId, inboxId], (err, projetos) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(queryTarefas, [userId], (err, todasTarefas) => {
      if (err) return res.status(500).json({ error: err.message });

      const tarefasIndividuais = todasTarefas.filter(t => t.projeto_id === inboxId);
      
      const projetosComTarefas = projetos.map(p => ({
        id: p.projeto_id,
        title: p.nome,
        tasks: todasTarefas
            .filter(t => t.projeto_id === p.projeto_id)
            .map(t => ({ id: t.tarefa_id, title: t.titulo, done: !!t.concluida }))
      }));

      const tarefasSoltas = tarefasIndividuais.map(t => ({
          id: t.tarefa_id, title: t.titulo, done: !!t.concluida 
      }));

      res.json({ projects: projetosComTarefas, tasks: tarefasSoltas, inboxId: inboxId });
    });
  });
});

// Rota de criação de tarefa INTELIGENTE (funciona com ou sem projeto)
app.post('/api/tasks', verificarLogin, (req, res) => {
    let projetoId = req.body.projectId;

    // Se não veio ID de projeto, tenta usar o Inbox da sessão
    if (!projetoId && req.session.inboxId) {
        projetoId = req.session.inboxId;
    }

    // Se ainda assim não tiver ID (caso raro de erro na sessão), não salva
    if (!projetoId) {
        return res.status(500).json({error: "Erro: Projeto de destino (Inbox) não encontrado."});
    }
    
    db.run(`INSERT INTO tarefas (titulo, projeto_id) VALUES (?, ?)`, [req.body.title, projetoId], function(err) {
        if (err) return res.status(500).send(err.message);
        res.json({ id: this.lastID });
    });
});

app.post('/api/projects', verificarLogin, (req, res) => {
    const { title } = req.body;
    db.run(`INSERT INTO projetos (nome, usuario_id) VALUES (?, ?)`, [title, req.session.userId], function(err) {
        if (err) return res.status(500).send(err.message);
        res.json({ id: this.lastID });
    });
});

app.patch('/api/tasks/:id/toggle', verificarLogin, (req, res) => {
    const { done } = req.body;
    db.run(`UPDATE tarefas SET concluida = ? WHERE tarefa_id = ?`, [done ? 1 : 0, req.params.id], (err) => {
        if (err) return res.status(500).send(err.message);
        res.sendStatus(200);
    });
});

app.delete('/api/tasks/:id', verificarLogin, (req, res) => {
    db.run(`DELETE FROM tarefas WHERE tarefa_id = ?`, [req.params.id], (err) => {
        if (err) return res.status(500).send(err.message);
        res.sendStatus(200);
    });
});

app.delete('/api/projects/:id', verificarLogin, (req, res) => {
    db.run(`DELETE FROM projetos WHERE projeto_id = ? AND usuario_id = ?`, [req.params.id, req.session.userId], (err) => {
        if (err) return res.status(500).send(err.message);
        res.sendStatus(200);
    });
});

// ARQUIVOS ESTÁTICOS NO FINAL
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));