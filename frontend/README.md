# Financify — Front-end

**English** · [Português](#português)

Web interface (React + Vite) for the Financify API: login and sign-up, a dashboard with balance, month-by-month chart and spending by category, transactions CRUD with filters and pagination, and account settings. Amounts are shown in euro (€).

## Running

With the API running (see the [root README](../README.md)):

```bash
npm install
npm run dev     # http://localhost:5173
```

The API must allow the front-end origin in CORS (`CORS_ORIGIN=http://localhost:5173`, already the default in `.env.example`). To use another API, copy `.env.example` to `.env` and set `VITE_API_URL`.

`npm run build` creates the production build in `dist/`.

## Structure

```
src/
├── main.jsx, App.jsx   # entry point, session and tabs
├── api.js              # API client (token, errors, expired session)
├── format.js           # euro and date formatting/parsing
├── components/         # Autenticacao, Painel, Transacoes, FormularioTransacao, Perfil
└── styles.css
```

---

## Português

Interface web (React + Vite) para a API do Financify: login e cadastro, painel com saldo, gráfico mês a mês e gastos por categoria, CRUD de transações com filtros e paginação, e edição da conta. Os valores são exibidos em euro (€).

### Como rodar

Com a API rodando (veja o [README da raiz](../README.pt-BR.md)):

```bash
npm install
npm run dev     # http://localhost:5173
```

A API precisa liberar a origem do front no CORS (`CORS_ORIGIN=http://localhost:5173`, que já é o padrão do `.env.example`). Para apontar para outra API, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

`npm run build` gera a versão de produção em `dist/`.

### Estrutura

Veja a árvore acima: `api.js` é o cliente da API, `format.js` cuida de euro e datas e `components/` tem as telas.
