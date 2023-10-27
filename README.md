![](https://i.imgur.com/8Yv5svw.png)

 ## _Essa API é projetada para ser usada em um sistema de gerenciamento financeiro, aplicativo bancário ou qualquer aplicação que envolva o controle de transações e perfis de usuário._


**Imagens**

<table>
  <tr>
    <td>
      <img src="https://i.imgur.com/4qMMrNF.png" alt="" style="width: 100%; height: auto;">
      <div style="text-align: center;">Funcionalidades no Insomnia</div>
    </td>
    <td>
      <img src="https://i.imgur.com/jdQaayk.png" alt="" style="width: 100%; height: auto;">
      <div style="text-align: center;">Organização das pastas</div>
    </td>
  </tr>
</table>


**Segue abaixo instruções de como executar**


npm install para instalar pacotes utilizados para construção desta API:

- 'pg' - criação do Pool para conexão com o banco de dados;

- 'bcrypt' - Responsável pela segurança da informação "senha" do usuário

- 'jsonwebtoken' - Responsável pela criação de um token para autenticação do usuário

- 'express' - Criação da API

## IMPORTANTE!

No arquivo "conexao.js" presente na pasta "src/config/connections" será necessário editar as informações de usuário necessárias para acessar o banco de dados local:

```
const { Pool } = require('pg');

const pool = new Pool({
  user: "SEU USUÁRIO AQUI",
  host: "localhost",
  database: "Financify",
  password: "SUA SENHA AQUI",
  port: 5432
});

module.exports = pool
```

Após instalação de pacotes e edição do arquivo "conexao.js", execute o comando:

    npm run dev


**Agora a API já está funcionando!**

Funcionalidades: 


**Usuário**

- Cadastrar Usuário

- Fazer Login 

- Detalhar Perfil do Usuário Logado 

- Editar Perfil do Usuário Logado 


**Transações e Categorias**

- Listar categorias 

- Listar transações 

- Detalhar transação 

- Cadastrar transação 

- Editar transação 

- Remover transação 

- Obter extrato de transações 

- Filtrar transações por categoria 


**Banco de dados**

Instruções para criação do banco de dados presentes no arquivo '/src/config/database/dump.sql' :

```
create database Financify;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT,
    email TEXT UNIQUE,
    senha TEXT 
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    descricao TEXT
);

CREATE TABLE transacoes (
    id SERIAL PRIMARY KEY,
    descricao TEXT,
    valor INTEGER,
    data DATE,
    categoria_id INTEGER REFERENCES categorias(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo TEXT
);

INSERT INTO categorias (descricao) VALUES
    ('Alimentação'),
    ('Assinaturas e Serviços'),
    ('Casa'),
    ('Mercado'),
    ('Cuidados Pessoais'),
    ('Educação'),
    ('Família'),
    ('Lazer'),
    ('Pets'),
    ('Presentes'),
    ('Roupas'),
    ('Saúde'),
    ('Transporte'),
    ('Salário'),
    ('Vendas'),
    ('Outras receitas'),
    ('Outras despesas');
```

## Rotas e Endpoints - Usuário

- Cadastro de usuário:
  
  Método **POST**
  
  ''**/usuario**'' - Este endpoint permite a criação de novos usuários no sistema. Os usuários podem fornecer informações como nome, endereço de e-mail e senha para criar uma conta. Normalmente, esses dados seriam armazenados em um banco de dados para autenticação futura.

- Login do usuário:
  
  Método **POST**
  
  "**/login**" - Usuários registrados podem usar esse endpoint para autenticar-se no sistema. Eles fornecem suas credenciais (por exemplo, e-mail e senha) para obter um token de autenticação, que será usado para acessar recursos protegidos da API.

- Autenticação:
  
  O arquivo "validarLogin.js" é um middleware responsável pela criação do "token" no momento do **Login**. Este token é utilizado para fazer a autenticação do usuário para que possa acessar **todas** rotas exceto: "/usuario" e "/login".

- Detalhar Usuario Logado:
  
  Método **GET** 
  
  "**/usuario**" - Esse endpoint retorna informações detalhadas sobre o perfil do usuário atualmente autenticado. Isso pode incluir nome, endereço de e-mail, informações de contato e outras informações relevantes.
  
- Atualizar cadastro do usuário:
  
  Método **PUT**
  
  "**/usuarios**" - Usuários podem usar esse endpoint para atualizar informações do seu perfil. Eles podem modificar detalhes como nome, senha ou qualquer outra informação pessoal que o sistema permita.


## Rotas e Endpoints - Transições e Categorias

- Listar Categorias:
  
  Método **GET** 
  
  "**/categoria**" -  Este endpoint fornece uma lista de categorias disponíveis no sistema. No contexto de transações financeiras, as categorias podem ser usadas para classificar e organizar as transações.

 - Listar todas as transações do usuario logado:
  
  Método **GET**
  
  "**/transacao**" - Esse endpoint retorna uma lista de transações financeiras associadas ao usuário autenticado. As transações podem ser organizadas por data, valor, categoria, ou qualquer outro critério relevante.

  - Detalhar Transação:
  
  Método **GET** 
  
  "**/transacao/:id**" - Os usuários podem usar esse endpoint para obter detalhes específicos sobre uma transação individual. Normalmente, eles informariam um identificador único da transação para acessar os detalhes.

- Cadastrar de transação:
  
  Método **POST**
  
  ''**/transacao**'' -  Usuários podem adicionar novas transações financeiras ao sistema por meio deste endpoint. Isso pode incluir informações como data, valor, categoria e uma descrição da transação.

- Atualizar Transação:
  
  Método **PUT** 
  
  "**/transacao/:id**" - Se um usuário desejar modificar os detalhes de uma transação existente, ele pode usar este endpoint para atualizar informações como valor, categoria, ou qualquer outro campo relevante.

- Excluir Transação:
  
  Método **DELETE**
  
  "**/transacao/:id**" - Esse endpoint permite que os usuários excluam uma transação específica do sistema. Eles precisariam fornecer um identificador único para a transação que desejam remover.

- Obter extrato por transação:

  Método **GET**

  "**/transacao/extrato**" - Esta funcionalidade extra pode fornecer um extrato detalhado das transações do usuário, incluindo informações como resumo de despesas e receitas, etc.

- Filtrar transações por categoria:

  Método **GET**

  "**/transacao?filtro[]=**" - Este recurso extra permite que os usuários filtrem suas transações com base em categorias específicas. Isso é útil para visualizar despesas e receitas em categorias específicas, como alimentação, transporte, entretenimento, etc.


## Sobre o Autor

<div style="display: flex; align-items: center;">
  <img src="https://i.imgur.com/UHB40eA.jpg" width="100" height="100" style="margin-right: 20px;">
  <p>
    Olá! Meu nome é Alexandro Cunha, Tenho 24 anos e sou o autor deste projeto. Estou empolgado por compartilhar esta iniciativa com a comunidade do GitHub. 
    
    Desde ja quero lhe agradecer por visitar este repositório e por seu interesse neste projeto. Sinta-se à vontade para entrar em contato comigo se tiver alguma dúvida, sugestão ou comentário. Espero que este projeto seja útil para você e para a comunidade!
  </p>
</div>

### Quem Sou Eu?

Sou licenciado pleno em pedagogia, mas minha paixão por tecnologia e programação me levou a buscar novos horizontes. 
Atualmente, sou especializado em tecnologias como JavaScript, SQL, Express, Node.Js entre outras. Estou comprometido com meu crescimento como desenvolvedor e continuo a aprender e aprimorar minhas habilidades.

### Contato

[![Gmail](https://img.shields.io/badge/Gmail-c14438?style=for-the-badge&logo=Gmail&logoColor=white)](alexandrocunha4@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AlexandroCunha)
[![Linkedin](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/alexandrocunha/)