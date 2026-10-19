# Financify — Front-end

Interface web (React + Vite) para a API do Financify: login e cadastro, painel com saldo, gráfico mês a mês e gastos por categoria, CRUD de transações com filtros e paginação, e edição da conta.

## Como rodar

Com a API rodando (veja o README da raiz):

```bash
npm install
npm run dev     # http://localhost:5173
```

A API precisa liberar a origem do front no CORS (`CORS_ORIGIN=http://localhost:5173`, que já é o padrão do `.env.example`). Para apontar para outra API, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

`npm run build` gera a versão de produção em `dist/`.
