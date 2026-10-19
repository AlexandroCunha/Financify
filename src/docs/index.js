const { Router } = require('express')
const especificacao = require('./openapi')

// Página do Swagger UI (carregado de um CDN) apontando para a especificação desta API.
const PAGINA = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Financify API · Documentação</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: '/docs/openapi.json', dom_id: '#swagger-ui', persistAuthorization: true })
    </script>
  </body>
</html>`

const rotas = Router()
rotas.get('/', (req, res) => res.type('html').send(PAGINA))
rotas.get('/openapi.json', (req, res) => res.json(especificacao))

module.exports = rotas
