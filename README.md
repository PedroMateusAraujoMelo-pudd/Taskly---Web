#  Taskly 2.1 — Sistema estilo Todoist

Sistema de Login, Cadastro e Dashboard desenvolvido com Node.js, Express e SQLite, simulando um gerenciador de tarefas semelhante ao Todoist, com autenticação real, banco de dados e interface simples em HTML/CSS.

##  Orientador:

### Luiz Felipe Cirqueira dos Santos

##  Alunos:

### Ernesto da Silva Pereira Neto

### Fernando Roberto Felix Corá

### Pedro Augusto Costa Freitas

### Pedro Mateus Araújo Melo

#  Resumo do Projeto

O Taskly 2.1 é um sistema web criado com o objetivo de demonstrar o funcionamento básico de um aplicativo de gerenciamento de tarefas e projetos, incluindo:

Tela de Login

Tela de Cadastro

Dashboard interno

Banco de dados com Usuários, Projetos e Tarefas

Senhas protegidas com bcryptjs

Seu funcionamento é baseado em tecnologias simples e acessíveis, sendo ideal para estudos, portfólios e trabalhos acadêmicos.

#  Estrutura do Projeto
Taskly2.1/
│── node_modules/

│

│── public/

│   ├── login.html

│   ├── cadastro.html

│   ├── dashboard.html

│   └── assets/

│       └── login.css

│

│── init_db.js

│── server.js

│── package.json

│── database.db


#  Tecnologias Utilizadas

# Backend

Node.js

Express

SQLite3

Bcrypt.js

# Frontend

HTML5

CSS3

# Ambiente

Windows PowerShell ou terminal equivalente

# Como Instalar e Executar o Projeto
1️. Instale o Node.js

Baixe em: https://nodejs.org/

2️. Corrigir permissões do PowerShell (Windows)

Abra o PowerShell como administrador e execute:

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

3️. Instalar dependências

No diretório raiz do projeto:

npm install express-session
npm install express sqlite3 bcryptjs

4️. Inicializar o banco de dados (rodar uma vez)
node init_db.js


Esse comando cria o arquivo database.db e todas as tabelas necessárias.

5️. Iniciar o servidor
node server.js


Se tudo estiver correto, aparecerá:

Servidor rodando em http://localhost:3000

6️. Acessar o sistema

Abra o navegador e acesse:

http://localhost:3000

 Descrição dos Arquivos
 server.js

Gerencia o servidor, rotas e lógica de autenticação.

init_db.js

Cria todas as tabelas do banco de dados:

usuários

projetos

tarefas

índices

° HTML (login / cadastro / dashboard)

Telas principais do sistema.

° login.css

Responsável pelo layout e estilização.

° Segurança Implementada

Hash de senhas com bcryptjs

Proteção de integridade com chaves estrangeiras no SQLite

Validação de e-mail único

Verificação de senha confirmada

Rodando o servidor novamente

Sempre que quiser iniciar o sistema:

node server.js


Para encerrar:

CTRL + C
