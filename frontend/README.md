# Financify — Front-end

Web interface (React + Vite) for the Financify API: sign-in, sign-up and a demo account; a dashboard by month (balance compared with the previous month, month-by-month bars, spending by category and what was left each month); transactions grouped by day with filters and pagination; and account settings. Charts are plain CSS and SVG, with no chart library. Amounts are shown in euro (€), formatted for English (Ireland). Light and dark mode follow the system setting.

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
├── main.jsx, App.jsx   # entry point, session, side menu and demo entry (?demo)
├── api.js              # API client (token, errors, expired session)
├── format.js           # euro, date and month formatting/parsing
├── categories.js       # category colours, shared by charts, lists and the form
├── components/         # Auth, Dashboard, Charts, Transactions, TransactionForm, ConfirmDialog, Account
└── styles.css          # "Sea salt" palette, with a dark-mode variant
```
