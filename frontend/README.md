# Financify — Front-end

**English** · [Português](#português)

Web interface (React + Vite) for the Financify API: sign-in, sign-up and a demo account; a dashboard by month (balance compared with the previous month, month-by-month bars, spending by category and monthly net line); transactions grouped by day with filters and pagination; and account settings. Charts are plain CSS and SVG, with no chart library. Amounts are shown in euro (€). Light and dark mode follow the system setting.

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
├── categorias.js       # category colours, shared by charts, lists and the form
├── components/         # Autenticacao, Painel, Graficos, Transacoes, FormularioTransacao, Confirmar, Perfil
└── styles.css          # "Mar e sal" palette, with a dark-mode variant
```

---

## Português

Interface web (React + Vite) para a API do Financify: entrada, cadastro e conta de demonstração; painel por mês (saldo comparado com o mês anterior, barras mês a mês, gastos por categoria e linha de quanto sobrou em cada mês); transações agrupadas por dia com filtros e paginação; e edição da conta. Os gráficos são feitos só com CSS e SVG, sem biblioteca. Os valores são exibidos em euro (€). Os modos claro e escuro seguem a configuração do sistema.

### Como rodar

Com a API rodando (veja o [README da raiz](../README.pt-BR.md)):

```bash
npm install
npm run dev     # http://localhost:5173
```

A API precisa liberar a origem do front no CORS (`CORS_ORIGIN=http://localhost:5173`, que já é o padrão do `.env.example`). Para apontar para outra API, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

`npm run build` gera a versão de produção em `dist/`.

### Estrutura

Veja a árvore acima: `api.js` é o cliente da API, `format.js` cuida de euro, datas e meses, `categorias.js` define a cor de cada categoria e `components/` tem as telas (`Graficos.jsx` reúne os gráficos e `Confirmar.jsx` a janela de confirmação).
