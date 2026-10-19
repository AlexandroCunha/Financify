<p align="center">
  <img src="https://i.imgur.com/8Yv5svw.png" alt="Financify" width="640">
</p>

<h3 align="center">Know where your money goes.</h3>

<p align="center">
  Personal finance in euros: a REST API and a web app to record income and expenses,<br>
  see your balance and spot spending patterns by category and by month.
</p>

<p align="center">
  <strong>English</strong> · <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <a href="https://github.com/AlexandroCunha/Financify/actions/workflows/ci.yml"><img src="https://github.com/AlexandroCunha/Financify/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22+">
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express 5">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
</p>

## Contents

[Screenshots](#screenshots) · [Features](#features) · [Tech stack](#tech-stack) · [Quick start](#quick-start) · [Configuration](#configuration) · [API](#api) · [Architecture](#architecture) · [Tests](#tests) · [Contributing](#contributing) · [Roadmap](#roadmap) · [Author](#about-the-author)

## Screenshots

<p align="center">
  <img src="docs/screenshots/painel.png" alt="Dashboard with balance, monthly chart and spending by category" width="720">
</p>

<details>
<summary>More screenshots</summary>

<p align="center">
  <img src="docs/screenshots/transacoes.png" alt="Transactions list with filters and pagination" width="720">
  <img src="docs/screenshots/nova-transacao.png" alt="New transaction form" width="720">
</p>

</details>

## Features

- **Accounts:** sign-up, JWT login, profile editing, password change and account deletion.
- **Transactions:** income and expenses with category, date and amount, plus filters (type, category, period), sorting and pagination.
- **Insights:** statement with income, expenses, balance and totals per category, and a month-by-month summary ready for charts.
- **Web app:** React dashboard with balance cards, a yearly chart and spending by category, plus transaction management and account settings.
- **Euro (€):** amounts are stored as integer cents, so there are no floating-point errors.
- **Interactive docs:** Swagger UI at `/docs`.
- **Secure by default:** secrets outside the code, bcrypt hashing, validation of every input, login rate limiting, CORS and security headers.

## Tech stack

| Layer | Technology |
| --- | --- |
| API | Node.js 22+, Express 5, `pg`, `jsonwebtoken`, `bcrypt` |
| Database | PostgreSQL 17 with versioned SQL migrations |
| Web app | React 18, Vite 6 (no UI or chart libraries) |
| Tests | Node's built-in test runner against a real PostgreSQL |
| CI | GitHub Actions |

## Quick start

**Requirements:** [Node.js](https://nodejs.org) 22+ (24 LTS recommended) and [Docker](https://www.docker.com/products/docker-desktop/) (or a local PostgreSQL, see below).

```bash
# 1. API
npm install
npm run setup          # creates .env with a random JWT_SECRET
docker compose up -d   # starts PostgreSQL on port 5433
npm run dev            # creates the tables and starts the API on :3000

# 2. Web app (in another terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Open http://localhost:5173, create an account and start adding transactions. The API docs are at http://localhost:3000/docs.

<details>
<summary><strong>Without Docker</strong> (PostgreSQL installed on your machine)</summary>

Point `DATABASE_URL` in `.env` to your PostgreSQL, for example:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/financify
```

The API tries to create the database on first run. If that fails, create it yourself (`createdb financify`). Use a fresh database: version 1 tables are not compatible with version 2.

</details>

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the API and restarts it on code changes |
| `npm start` | Starts the API (production) |
| `npm test` | Runs the test suite against a separate database (`financify_test`) |
| `npm run db:migrate` | Creates or updates the tables (`dev` and `start` already do this) |
| `npm run setup` | Creates `.env` from `.env.example` |

The web app has its own scripts: see [`frontend/README.md`](frontend/README.md).

## Configuration

Set in `.env` (created by `npm run setup`):

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | | PostgreSQL connection string |
| `JWT_SECRET` | yes | | Secret used to sign tokens (at least 32 characters) |
| `JWT_EXPIRES_IN` | no | `1d` | Token lifetime (`1h`, `7d`...) |
| `PORT` | no | `3000` | API port |
| `CORS_ORIGIN` | no | | Allowed front-end origins, comma-separated |
| `LOGIN_MAX_TENTATIVAS` | no | `10` | Login attempts per IP every 15 minutes (`0` disables the limit) |
| `TRUST_PROXY` | no | | Use `1` in production behind a proxy (Render, Railway...) |
| `DATABASE_URL_TEST` | no | `DATABASE_URL` + `_test` | Database used by the tests |

## API

All routes require `Authorization: Bearer <token>`, except sign-up, login, `/health` and `/docs`.

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/usuarios` | Create a user |
| `POST` | `/login` | Log in and receive the token |
| `GET` | `/usuarios/me` | Current user |
| `PATCH` | `/usuarios/me` | Change name and/or e-mail |
| `PUT` | `/usuarios/me/senha` | Change the password |
| `DELETE` | `/usuarios/me` | Delete the account and its transactions |
| `GET` | `/categorias` | List categories |
| `GET` | `/transacoes` | List transactions (filters: `tipo`, `categoria_id`, `de`, `ate`, `pagina`, `limite`, `ordem`) |
| `POST` | `/transacoes` | Create a transaction |
| `GET` | `/transacoes/:id` | Get a transaction |
| `PUT` | `/transacoes/:id` | Update a transaction |
| `DELETE` | `/transacoes/:id` | Delete a transaction |
| `GET` | `/transacoes/extrato` | Income, expenses, balance and totals per category (filters: `de`, `ate`) |
| `GET` | `/transacoes/resumo-mensal` | Month-by-month totals for a year (filter: `ano`) |
| `GET` | `/health` | Checks that the API and the database are up |

> **Conventions:** route names and JSON fields are in Portuguese (`transacoes`, `valor`, `data`...). Amounts are **euro cents** and dates use `YYYY-MM-DD`: `"valor": 1050` is € 10.50.

### Example

```bash
# sign up
curl -X POST http://localhost:3000/usuarios -H "Content-Type: application/json" \
  -d '{"nome":"Ana Souza","email":"ana@email.com","senha":"strong-password-123"}'

# log in (keep the token in a variable)
TOKEN=$(curl -s -X POST http://localhost:3000/login -H "Content-Type: application/json" \
  -d '{"email":"ana@email.com","senha":"strong-password-123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

# new transaction (category 14 = Salário / salary)
curl -X POST http://localhost:3000/transacoes -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"descricao":"Salary","valor":500000,"data":"2026-10-05","categoria_id":14,"tipo":"entrada"}'

# statement for October
curl "http://localhost:3000/transacoes/extrato?de=2026-10-01&ate=2026-10-31" -H "Authorization: Bearer $TOKEN"
```

Errors always have the same shape (messages are in Portuguese):

```json
{
  "mensagem": "Dados inválidos.",
  "erros": { "valor": "deve ser um número inteiro maior que zero, em centavos (ex.: 1050 = € 10,50)" }
}
```

## Architecture

```mermaid
flowchart LR
  Web["Web app<br/>React + Vite"] -->|HTTP + JWT| Routes
  subgraph API["API (Express 5)"]
    Routes --> Controllers --> Services --> Repositories
  end
  Repositories -->|SQL| DB[(PostgreSQL)]
```

Each layer has one job: **controllers** validate input and build the response, **services** hold the business rules and **repositories** run the SQL.

```
src/
├── server.js          # starts the HTTP server (after preparing the database)
├── app.js             # builds the Express app: middlewares, routes and error handling
├── config/env.js      # reads and validates environment variables
├── db/                # connection, versioned .sql migrations and database setup
├── routes/            # route map
├── controllers/       # HTTP layer
├── services/          # business rules
├── repositories/      # SQL queries
├── validations/       # input validation rules
├── middlewares/       # authentication, security, login rate limit, logging and errors
├── docs/              # OpenAPI spec and Swagger page
└── utils/
frontend/              # web app (React + Vite)
test/                  # end-to-end tests
```

## Tests

```bash
npm test
```

The tests start the real API against a real PostgreSQL in a separate database (`financify_test`), cleaned before each test. They cover sign-up and login, authentication, validation, isolation between users, filters, statement, monthly summary and the docs. GitHub Actions runs the suite on every push and pull request.

## Contributing

- Branch from `main` (`feat/...`, `fix/...`, `docs/...`) and open a Pull Request: CI must pass.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `ci:`...).
- Keep the code simple: small functions, clear names, one responsibility per layer and a test for every behavior change.
- Database changes go in as a **new** migration in `src/db/migrations/`; never edit one that has already been applied.

## Roadmap

- [x] Web app with a dashboard
- [x] Euro as the currency
- [ ] Deployment with a public link
- [ ] Budgets per category and recurring transactions
- [ ] Bank statement import (CSV/OFX)

<details>
<summary><strong>What changed in version 2</strong></summary>

Version 1 started in 2023 as a Cubos Academy module 3 challenge. Version 2 modernizes it:

- **Up-to-date stack:** Express 5, Node.js 22+ and bcrypt 6, no dev dependencies (built-in test runner and watch mode).
- **Secrets out of the code:** database password and JWT key moved to `.env`.
- **Versioned database:** SQL migrations with constraints (`NOT NULL`, `CHECK`, case-insensitive unique e-mail) and an index.
- **Validation of all input:** negative amounts used to be accepted and text instead of a number caused a 500 error.
- **Bugs fixed:** the statement returned numbers as text; dates shifted by one day depending on the time zone; getting one transaction returned a list; the filter without `[]` crashed the route.
- **Safer login:** does not reveal whether an e-mail exists, rate-limited, tokens expire after one day.
- **Organization:** layered architecture, standardized JSON errors, Swagger docs, automated tests, euro currency and the React web app.

</details>

## About the author

<div style="display: flex; align-items: center;">
  <img src="https://i.imgur.com/UHB40eA.jpg" width="100" height="100" style="margin-right: 20px;">
  <p>
     Hi! I'm Alexandro Cunha, the author of this project. I hold a teaching degree in pedagogy, but my passion for technology led me to programming. I now work with JavaScript, SQL, Express and Node.js, among others, and keep learning every day.
  </p>
</div>

[![Gmail](https://img.shields.io/badge/-Gmail-c14438?style=for-the-badge&logo=Gmail&logoColor=white&link=mailto:alexandrocunha4@gmail.com)](mailto:alexandrocunha4@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AlexandroCunha)
[![Linkedin](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/alexandrocunha/)

Thanks for visiting! Feel free to get in touch with questions, suggestions or comments.
