<p align="center">
  <img src="https://i.imgur.com/8Yv5svw.png" alt="Financify" width="640">
</p>

<h3 align="center">Saiba para onde vai o seu dinheiro.</h3>

<p align="center">
  Finanças pessoais em euros: uma API REST e um app web para registrar entradas e saídas,<br>
  ver o saldo e entender seus gastos por categoria e por mês.
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>Português</strong>
</p>

<p align="center">
  <a href="https://github.com/AlexandroCunha/Financify/actions/workflows/ci.yml"><img src="https://github.com/AlexandroCunha/Financify/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22+">
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express 5">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
</p>

## Sumário

[Funcionalidades](#funcionalidades) · [Tecnologias](#tecnologias) · [Início rápido](#início-rápido) · [Configuração](#configuração) · [API](#api) · [Arquitetura](#arquitetura) · [Testes](#testes) · [Como contribuir](#como-contribuir) · [Próximos passos](#próximos-passos) · [Autor](#sobre-o-autor)

## Funcionalidades

- **Contas:** cadastro, login com JWT, edição do perfil, troca de senha e exclusão da conta.
- **Transações:** entradas e saídas com categoria, data e valor, com filtros (tipo, categoria, período), ordenação e paginação.
- **Análises:** extrato com entradas, saídas, saldo e totais por categoria, e resumo mês a mês pronto para gráficos.
- **App web:** painel em React com cartões de saldo, gráfico do ano e gastos por categoria, além do gerenciamento de transações e da conta.
- **Euro (€):** os valores são guardados em centavos inteiros, sem erros de ponto flutuante.
- **Documentação interativa:** Swagger em `/docs`.
- **Seguro por padrão:** segredos fora do código, senhas com bcrypt, validação de todos os dados, limite de tentativas de login, CORS e cabeçalhos de segurança.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| API | Node.js 22+, Express 5, `pg`, `jsonwebtoken`, `bcrypt` |
| Banco de dados | PostgreSQL 17 com migrações SQL versionadas |
| App web | React 18, Vite 6 (sem bibliotecas de UI ou de gráficos) |
| Testes | Test runner nativo do Node, com PostgreSQL de verdade |
| CI | GitHub Actions |

## Início rápido

**Pré-requisitos:** [Node.js](https://nodejs.org) 22+ (recomendado: 24 LTS) e [Docker](https://www.docker.com/products/docker-desktop/) (ou um PostgreSQL local, veja abaixo).

```bash
# 1. API
npm install
npm run setup          # cria o .env com um JWT_SECRET aleatório
docker compose up -d   # sobe o PostgreSQL na porta 5433
npm run dev            # cria as tabelas e inicia a API na :3000

# 2. App web (em outro terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Abra http://localhost:5173, crie uma conta e comece a lançar transações. A documentação da API fica em http://localhost:3000/docs.

<details>
<summary><strong>Sem Docker</strong> (PostgreSQL instalado na máquina)</summary>

No `.env`, aponte o `DATABASE_URL` para o seu PostgreSQL, por exemplo:

```
DATABASE_URL=postgres://postgres:SUA_SENHA@localhost:5432/financify
```

A API tenta criar o banco na primeira execução. Se não conseguir, crie você mesmo (`createdb financify`). Use um banco novo: as tabelas da versão 1 não são compatíveis com a versão 2.

</details>

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia a API e reinicia a cada alteração no código |
| `npm start` | Inicia a API (produção) |
| `npm test` | Roda os testes num banco separado (`financify_test`) |
| `npm run db:migrate` | Cria ou atualiza as tabelas (o `dev` e o `start` já fazem isso) |
| `npm run setup` | Cria o `.env` a partir do `.env.example` |

O app web tem scripts próprios: veja o [`frontend/README.md`](frontend/README.md).

## Configuração

Definida no `.env` (criado por `npm run setup`):

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `DATABASE_URL` | sim | | Conexão com o PostgreSQL |
| `JWT_SECRET` | sim | | Segredo que assina os tokens (mínimo de 32 caracteres) |
| `JWT_EXPIRES_IN` | não | `1d` | Validade do token (`1h`, `7d`...) |
| `PORT` | não | `3000` | Porta da API |
| `CORS_ORIGIN` | não | | Endereços do front-end liberados, separados por vírgula |
| `LOGIN_MAX_TENTATIVAS` | não | `10` | Tentativas de login por IP a cada 15 minutos (`0` desliga) |
| `TRUST_PROXY` | não | | Use `1` em produção atrás de um proxy (Render, Railway...) |
| `DATABASE_URL_TEST` | não | `DATABASE_URL` + `_test` | Banco usado pelos testes |

## API

Todas as rotas exigem `Authorization: Bearer <token>`, exceto cadastro, login, `/health` e `/docs`.

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/usuarios` | Cadastrar usuário |
| `POST` | `/login` | Fazer login e receber o token |
| `GET` | `/usuarios/me` | Dados do usuário logado |
| `PATCH` | `/usuarios/me` | Alterar nome e/ou e-mail |
| `PUT` | `/usuarios/me/senha` | Trocar a senha |
| `DELETE` | `/usuarios/me` | Excluir a conta e as transações |
| `GET` | `/categorias` | Listar categorias |
| `GET` | `/transacoes` | Listar transações (filtros: `tipo`, `categoria_id`, `de`, `ate`, `pagina`, `limite`, `ordem`) |
| `POST` | `/transacoes` | Cadastrar transação |
| `GET` | `/transacoes/:id` | Detalhar transação |
| `PUT` | `/transacoes/:id` | Atualizar transação |
| `DELETE` | `/transacoes/:id` | Excluir transação |
| `GET` | `/transacoes/extrato` | Entradas, saídas, saldo e totais por categoria (filtros: `de`, `ate`) |
| `GET` | `/transacoes/resumo-mensal` | Totais mês a mês de um ano (filtro: `ano`) |
| `GET` | `/health` | Verifica se a API e o banco estão no ar |

> **Convenções:** os valores são em **centavos de euro** e as datas no formato `AAAA-MM-DD`: `"valor": 1050` é € 10,50.

### Exemplo

```bash
# cadastro
curl -X POST http://localhost:3000/usuarios -H "Content-Type: application/json" \
  -d '{"nome":"Ana Souza","email":"ana@email.com","senha":"senha-forte-123"}'

# login (guarda o token numa variável)
TOKEN=$(curl -s -X POST http://localhost:3000/login -H "Content-Type: application/json" \
  -d '{"email":"ana@email.com","senha":"senha-forte-123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

# nova transação (categoria 14 = Salário)
curl -X POST http://localhost:3000/transacoes -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"descricao":"Salário","valor":500000,"data":"2026-10-05","categoria_id":14,"tipo":"entrada"}'

# extrato de outubro
curl "http://localhost:3000/transacoes/extrato?de=2026-10-01&ate=2026-10-31" -H "Authorization: Bearer $TOKEN"
```

Os erros seguem sempre o mesmo formato:

```json
{
  "mensagem": "Dados inválidos.",
  "erros": { "valor": "deve ser um número inteiro maior que zero, em centavos (ex.: 1050 = € 10,50)" }
}
```

## Arquitetura

```mermaid
flowchart LR
  Web["App web<br/>React + Vite"] -->|HTTP + JWT| Rotas
  subgraph API["API (Express 5)"]
    Rotas --> Controllers --> Services --> Repositories
  end
  Repositories -->|SQL| DB[(PostgreSQL)]
```

Cada camada tem uma função: os **controllers** validam a entrada e montam a resposta, os **services** guardam as regras de negócio e os **repositories** executam o SQL.

```
src/
├── server.js          # sobe o servidor HTTP (antes, prepara o banco)
├── app.js             # monta o Express: middlewares, rotas e tratamento de erros
├── config/env.js      # lê e valida as variáveis de ambiente
├── db/                # conexão, migrações (.sql versionados) e preparo do banco
├── routes/            # mapa de rotas
├── controllers/       # camada HTTP
├── services/          # regras de negócio
├── repositories/      # consultas SQL
├── validations/       # regras de validação dos dados de entrada
├── middlewares/       # autenticação, segurança, limite de login, log e erros
├── docs/              # especificação OpenAPI e página do Swagger
└── utils/
frontend/              # app web (React + Vite)
test/                  # testes de ponta a ponta
```

## Testes

```bash
npm test
```

Os testes sobem a API de verdade e usam um PostgreSQL real, num banco separado (`financify_test`) que é limpo antes de cada teste. Eles cobrem cadastro e login, autenticação, validações, isolamento entre usuários, filtros, extrato, resumo mensal e a documentação. O GitHub Actions roda a suíte a cada push e pull request.

## Como contribuir

- Crie uma branch a partir de `main` (`feat/...`, `fix/...`, `docs/...`) e abra um Pull Request: o CI precisa passar.
- Mensagens de commit seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `docs:`, `refactor:`, `ci:`...).
- Mantenha o código simples: funções pequenas, nomes claros, uma responsabilidade por camada e um teste para cada mudança de comportamento.
- Mudanças no banco entram como uma **nova** migração em `src/db/migrations/`; nunca edite uma já aplicada.

## Próximos passos

- [x] App web com painel
- [x] Euro como moeda
- [ ] Deploy com link público
- [ ] Orçamento por categoria e transações recorrentes
- [ ] Importação de extrato bancário (CSV/OFX)

<details>
<summary><strong>O que mudou na versão 2</strong></summary>

A primeira versão nasceu em 2023 como desafio do módulo 3 da Cubos Academy. A versão 2 moderniza o projeto:

- **Stack atualizada:** Express 5, Node.js 22+ e bcrypt 6, sem dependências de desenvolvimento (testes e *watch* nativos do Node).
- **Segredos fora do código:** a senha do banco e a chave do JWT foram para o `.env`.
- **Banco versionado:** migrações em SQL, com restrições (`NOT NULL`, `CHECK`, e-mail único sem diferenciar maiúsculas) e índice.
- **Validação de todos os dados de entrada:** antes, valores negativos eram aceitos e texto no lugar de número dava erro 500.
- **Bugs corrigidos:** o extrato devolvia os números como texto; as datas "voltavam" um dia dependendo do fuso horário; detalhar uma transação devolvia uma lista; o filtro sem `[]` derrubava a rota.
- **Login mais seguro:** não revela se o e-mail existe, tem limite de tentativas e o token expira em 1 dia.
- **Organização:** arquitetura em camadas, erros padronizados em JSON, documentação Swagger, testes automatizados, moeda em euro e o app web em React.

</details>

## Sobre o autor

<div style="display: flex; align-items: center;">
  <img src="https://i.imgur.com/UHB40eA.jpg" width="100" height="100" style="margin-right: 20px;">
  <p>
     Olá! Sou Alexandro Cunha, autor deste projeto. Sou licenciado em pedagogia, mas a paixão por tecnologia me levou à programação. Hoje trabalho com JavaScript, SQL, Express e Node.js, entre outras, e continuo aprendendo todos os dias.
  </p>
</div>

[![Gmail](https://img.shields.io/badge/-Gmail-c14438?style=for-the-badge&logo=Gmail&logoColor=white&link=mailto:alexandrocunha4@gmail.com)](mailto:alexandrocunha4@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AlexandroCunha)
[![Linkedin](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/alexandrocunha/)

Obrigado por visitar! Fique à vontade para entrar em contato com dúvidas, sugestões ou comentários.
