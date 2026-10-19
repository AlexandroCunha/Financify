<p align="center">
  <img src="https://i.imgur.com/8Yv5svw.png" alt="Financify" width="640">
</p>

<p align="center">
  <strong>English</strong> · <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  REST API for personal finance: users, income and expense transactions, categories, statements and monthly summaries.
</p>

<p align="center">
  <a href="https://github.com/AlexandroCunha/Financify/actions/workflows/ci.yml"><img src="https://github.com/AlexandroCunha/Financify/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 22+">
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express 5">
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
</p>

## Features

- **User accounts:** sign-up, JWT login, profile editing, password change and account deletion.
- **Transactions** of type income or expense, with category, date and amount in cents.
- **Listing** with filters by type, category and period, pagination and sorting.
- **Statement** with income, expenses, balance and totals per category, plus a **month-by-month summary** ready for charts.
- **Web front-end** built with React (dashboard with charts, transactions and account), in the `frontend/` folder.
- **Currency:** euro (€). Amounts are stored as integer cents.
- **Interactive documentation** (Swagger) at `/docs`.
- **Security:** secrets kept out of the code, bcrypt password hashing, validation of all input, login rate limiting, CORS and security headers.

## Getting started

**Requirements:** [Node.js](https://nodejs.org) 22 or newer (24 LTS recommended) and [Docker](https://www.docker.com/products/docker-desktop/), or a local PostgreSQL.

```bash
npm install            # install dependencies
npm run setup          # create .env with a random JWT_SECRET
docker compose up -d   # start PostgreSQL (port 5433)
npm run dev            # create the tables and start the API, restarting on changes
```

The API listens on http://localhost:3000 and the docs are at http://localhost:3000/docs.

<details>
<summary><strong>Without Docker</strong> (PostgreSQL installed on your machine)</summary>

Point `DATABASE_URL` in `.env` to your PostgreSQL, for example:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/financify
```

The API tries to create the database on first run. If that fails, create it yourself (`createdb financify`). Use a fresh database: version 1 tables are not compatible with version 2.

</details>

## Front-end

With the API running, in another terminal:

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

More details in [`frontend/README.md`](frontend/README.md).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the API and restarts it on code changes |
| `npm start` | Starts the API (production) |
| `npm test` | Runs the automated tests against a separate database (`financify_test`) |
| `npm run db:migrate` | Creates or updates the tables (`dev` and `start` already do this) |
| `npm run setup` | Creates `.env` from `.env.example` |

## Environment variables

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

## Endpoints

All routes require the `Authorization: Bearer <token>` header, except sign-up, login, `/health` and `/docs`.

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

> Route names and JSON fields are in Portuguese (`transacoes`, `valor`, `data`...). **Amounts are in euro cents and dates use `YYYY-MM-DD`:** `"valor": 1050` is € 10.50 and `"data": "2026-10-19"`.

### Quick example

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

## Project structure

```
src/
├── server.js          # starts the HTTP server (after preparing the database)
├── app.js             # builds the Express app: middlewares, routes and error handling
├── config/env.js      # reads and validates environment variables
├── db/                # connection, versioned .sql migrations and database setup
├── routes/            # route map
├── controllers/       # HTTP layer: validates input and builds the response
├── services/          # business rules
├── repositories/      # SQL queries
├── validations/       # input validation rules
├── middlewares/       # authentication, security, login rate limit, logging and errors
├── docs/              # OpenAPI spec and Swagger page
└── utils/
frontend/              # web interface (React + Vite)
test/                  # end-to-end tests (node:test + a real PostgreSQL)
```

## Tests

```bash
npm test
```

The tests start the real API against a real PostgreSQL in a separate database (`financify_test`) that is cleaned before each test. They cover sign-up and login, authentication, validation, isolation between users, filters, statement, monthly summary and the docs. GitHub Actions runs the suite on every push and pull request.

## Contributing

- Branch from `main` (`feat/...`, `fix/...`, `docs/...`) and open a Pull Request: CI must pass.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `ci:`...).
- Keep the code simple: small functions, clear names, one responsibility per layer (route → controller → service → repository) and a test for every behavior change.
- Database changes go in as a **new** migration in `src/db/migrations/`; never edit a migration that has already been applied.

## What changed in version 2

Version 1 started in 2023 as a Cubos Academy module 3 challenge. Version 2 modernizes the project:

- **Up-to-date stack:** Express 5, Node.js 22+ and bcrypt 6, with no dev dependencies (Node's built-in test runner and watch mode).
- **Secrets out of the code:** the database password and the JWT key moved to `.env`.
- **Versioned database:** SQL migrations with constraints (`NOT NULL`, `CHECK`, case-insensitive unique e-mail) and an index.
- **Validation of all input:** negative amounts used to be accepted and text instead of a number caused a 500 error.
- **Bugs fixed:**
  - the statement returned numbers as text;
  - dates shifted by one day depending on the time zone;
  - getting one transaction returned a list;
  - the filter without `[]` crashed the route.
- **Safer login:** it does not reveal whether an e-mail exists, has an attempt limit, and tokens expire after one day.
- **Organization:** layered architecture, standardized JSON errors, Swagger docs and automated tests.
- **Euro as the currency** and a **React front-end**.

## Roadmap

- [x] Front-end with a dashboard (charts from `/transacoes/resumo-mensal`)
- [ ] Deployment with a public link
- [ ] Budgets per category and recurring transactions
- [ ] Bank statement import (CSV/OFX)

## About the author

<div style="display: flex; align-items: center;">
  <img src="https://i.imgur.com/UHB40eA.jpg" width="100" height="100" style="margin-right: 20px;">
  <p>
     Hi! My name is Alexandro Cunha and I am the author of this project. I am excited to share it with the GitHub community.
  </p>
</div>

### Who am I?

I hold a teaching degree in pedagogy, but my passion for technology and programming led me to look for new horizons. I now specialize in JavaScript, SQL, Express and Node.js, among others, and keep learning and improving my skills as a developer.

### Contact

[![Gmail](https://img.shields.io/badge/-Gmail-c14438?style=for-the-badge&logo=Gmail&logoColor=white&link=mailto:alexandrocunha4@gmail.com)](mailto:alexandrocunha4@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AlexandroCunha)
[![Linkedin](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/alexandrocunha/)

Thank you for visiting this repository and for your interest in the project. Feel free to get in touch with any question, suggestion or comment. I hope it is useful to you and to the community!
