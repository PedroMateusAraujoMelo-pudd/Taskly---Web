// init_db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error("Erro ao abrir o banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco 'database.db'.");
  }
});

// Habilita o suporte a chaves estrangeiras no SQLite
db.run('PRAGMA foreign_keys = ON;', (err) => {
  if (err) {
    console.error("Erro ao ativar chaves estrangeiras:", err.message);
  } else {
    console.log("Suporte a chaves estrangeiras ativado.");
  }
});

// db.serialize() garante que os comandos rodem em sequência
db.serialize(() => {

  // --- 1. Tabela de Usuários ---
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("Erro ao criar tabela 'usuarios':", err.message);
    } else {
      console.log("Tabela 'usuarios' verificada/criada.");
    }
  });

  // --- 2. Tabela de Projetos ---
  db.run(`
    CREATE TABLE IF NOT EXISTS projetos (
      projeto_id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      usuario_id INTEGER NOT NULL,
      CONSTRAINT fk_projeto_usuario
          FOREIGN KEY (usuario_id)
          REFERENCES usuarios (usuario_id)
          ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error("Erro ao criar tabela 'projetos':", err.message);
    } else {
      console.log("Tabela 'projetos' verificada/criada.");
    }
  });

  // --- 3. Tabela de Tarefas ---
  db.run(`
    CREATE TABLE IF NOT EXISTS tarefas (
      tarefa_id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      concluida INTEGER DEFAULT 0, -- 0 = false, 1 = true
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_conclusao DATETIME,
      projeto_id INTEGER NOT NULL,
      CONSTRAINT fk_tarefa_projeto
          FOREIGN KEY (projeto_id)
          REFERENCES projetos (projeto_id)
          ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error("Erro ao criar tabela 'tarefas':", err.message);
    } else {
      console.log("Tabela 'tarefas' verificada/criada.");
    }
  });

  // --- 4. Índices ---
  db.run(`CREATE INDEX IF NOT EXISTS IX_Usuarios_Nome ON usuarios (nome);`);
  db.run(`CREATE INDEX IF NOT EXISTS IX_Projetos_UsuarioID ON projetos (usuario_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS IX_Tarefas_ProjetoID ON tarefas (projeto_id);`);

});

// Fecha a conexão com o banco
db.close((err) => {
  if (err) {
    console.error("Erro ao fechar o banco de dados:", err.message);
  } else {
    console.log("Banco de dados inicializado e conexão fechada.");
  }
});