const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

before(() => h.iniciar())
after(() => h.encerrar())
beforeEach(() => h.limparBanco())

describe('respostas de erro padronizadas', () => {
  it('JSON malformado: 400 em JSON, sem stack trace', async () => {
    const { status, corpo, cabecalhos } = await h.api('POST', '/login', { corpo: '{ruim' })
    assert.equal(status, 400)
    assert.match(cabecalhos.get('content-type'), /application\/json/)
    assert.deepEqual(corpo, { mensagem: 'O corpo da requisição não é um JSON válido.' })
  })

  it('rota inexistente: 404 em JSON, com ou sem token', async () => {
    const { token } = await h.criarUsuarioLogado()
    for (const opcoes of [{}, { token }]) {
      const { status, corpo } = await h.api('GET', '/nao-existe', opcoes)
      assert.equal(status, 404)
      assert.deepEqual(corpo, { mensagem: 'Rota não encontrada: GET /nao-existe' })
    }
  })
})

describe('sistema', () => {
  it('GET / identifica a API', async () => {
    const { status, corpo } = await h.api('GET', '/')
    assert.equal(status, 200)
    assert.equal(corpo.nome, 'Financify API')
    assert.equal(corpo.documentacao, '/docs')
  })

  it('GET /health confirma que o banco responde', async () => {
    const { status, corpo } = await h.api('GET', '/health')
    assert.equal(status, 200)
    assert.deepEqual(corpo, { status: 'ok' })
  })

  it('envia cabeçalhos de segurança e esconde o X-Powered-By', async () => {
    const { cabecalhos } = await h.api('GET', '/')
    assert.equal(cabecalhos.get('x-content-type-options'), 'nosniff')
    assert.equal(cabecalhos.get('x-frame-options'), 'DENY')
    assert.equal(cabecalhos.get('x-powered-by'), null)
  })

  it('CORS: libera a origem configurada, responde ao preflight e ignora outras origens', async () => {
    const preflight = await h.api('OPTIONS', '/transacoes', {
      cabecalhos: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST' },
    })
    assert.equal(preflight.status, 204)
    assert.equal(preflight.cabecalhos.get('access-control-allow-origin'), 'http://localhost:5173')
    assert.match(preflight.cabecalhos.get('access-control-allow-headers'), /Authorization/)

    const outraOrigem = await h.api('GET', '/', { cabecalhos: { Origin: 'https://site-estranho.com' } })
    assert.equal(outraOrigem.cabecalhos.get('access-control-allow-origin'), null)
  })
})

describe('documentação', () => {
  it('GET /docs serve o Swagger UI', async () => {
    const { status, corpo, cabecalhos } = await h.api('GET', '/docs')
    assert.equal(status, 200)
    assert.match(cabecalhos.get('content-type'), /text\/html/)
    assert.match(corpo, /swagger-ui/)
  })

  it('toda rota documentada existe na API', async () => {
    const { corpo: especificacao } = await h.api('GET', '/docs/openapi.json')
    assert.equal(especificacao.openapi, '3.1.0')
    for (const [caminho, operacoes] of Object.entries(especificacao.paths)) {
      for (const metodo of Object.keys(operacoes).filter((chave) => chave !== 'parameters')) {
        const { token } = await h.criarUsuarioLogado() // conta nova a cada chamada (uma delas exclui a conta)
        const url = caminho.replace('{id}', '999999')
        const { status } = await h.api(metodo.toUpperCase(), url, { token, corpo: metodo === 'get' ? undefined : {} })
        // 404 só é aceitável quando a rota existe e o recurso é que não foi encontrado.
        const recursoNaoEncontrado = caminho.includes('{id}') && status === 404
        assert.ok(status !== 404 || recursoNaoEncontrado, `${metodo.toUpperCase()} ${caminho} não existe na API`)
      }
    }
  })
})
