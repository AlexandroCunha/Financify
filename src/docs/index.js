const { Router } = require('express')
const spec = require('./openapi')

// Swagger UI page (loaded from a CDN) pointing at this API's spec.
const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Financify API · Docs</title>
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

const routes = Router()
routes.get('/', (req, res) => res.type('html').send(PAGE))
routes.get('/openapi.json', (req, res) => res.json(spec))

module.exports = routes
