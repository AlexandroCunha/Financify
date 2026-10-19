// Especificação OpenAPI 3.1 da API: servida em /docs/openapi.json e exibida no Swagger UI em /docs.
const { version } = require('../../package.json')

const ref = (nome) => ({ $ref: `#/components/schemas/${nome}` })
const resposta = (descricao, schema) =>
  schema ? { description: descricao, content: { 'application/json': { schema } } } : { description: descricao }
const erro = (descricao) => resposta(descricao, ref('Erro'))
const corpo = (schema, example) => ({ required: true, content: { 'application/json': { schema, example } } })

const comLogin = [{ bearerAuth: [] }]
const semLogin = erro('Token ausente, inválido ou expirado')
const dadosInvalidos = erro('Dados inválidos (veja o campo "erros")')

const parametroId = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }
const parametrosDePeriodo = [
  { name: 'de', in: 'query', description: 'Data inicial (AAAA-MM-DD)', schema: { type: 'string', format: 'date' } },
  { name: 'ate', in: 'query', description: 'Data final (AAAA-MM-DD)', schema: { type: 'string', format: 'date' } },
]

const exemploTransacao = {
  descricao: 'Salário de outubro',
  valor: 500000,
  data: '2026-10-05',
  categoria_id: 14,
  tipo: 'entrada',
}

module.exports = {
  openapi: '3.1.0',
  info: {
    title: 'Financify API',
    version,
    description:
      'API REST para controle de finanças pessoais.\n\n' +
      '- Valores monetários são **inteiros em centavos** (1050 = € 10,50).\n' +
      '- Datas usam o formato **AAAA-MM-DD**.\n\n' +
      'Para testar por aqui: cadastre um usuário, faça login, copie o `token` e clique em **Authorize**.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Autenticação' },
    { name: 'Usuários' },
    { name: 'Categorias' },
    { name: 'Transações' },
    { name: 'Sistema' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Erro: {
        type: 'object',
        required: ['mensagem'],
        properties: {
          mensagem: { type: 'string', example: 'Dados inválidos.' },
          erros: {
            type: 'object',
            additionalProperties: { type: 'string' },
            example: { email: 'deve ser um e-mail válido' },
          },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Ana Souza' },
          email: { type: 'string', format: 'email', example: 'ana@email.com' },
          criado_em: { type: 'string', format: 'date-time' },
        },
      },
      NovoUsuario: {
        type: 'object',
        required: ['nome', 'email', 'senha'],
        properties: {
          nome: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email' },
          senha: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      AtualizacaoDeUsuario: {
        type: 'object',
        minProperties: 1,
        properties: {
          nome: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email' },
        },
      },
      TrocaDeSenha: {
        type: 'object',
        required: ['senha_atual', 'nova_senha'],
        properties: {
          senha_atual: { type: 'string' },
          nova_senha: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      Credenciais: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email' },
          senha: { type: 'string' },
        },
      },
      RespostaDeLogin: {
        type: 'object',
        properties: {
          usuario: ref('Usuario'),
          token: { type: 'string', description: 'Envie no header Authorization: Bearer <token>' },
        },
      },
      Categoria: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 14 },
          descricao: { type: 'string', example: 'Salário' },
        },
      },
      NovaTransacao: {
        type: 'object',
        required: ['descricao', 'valor', 'data', 'categoria_id', 'tipo'],
        properties: {
          descricao: { type: 'string', maxLength: 255 },
          valor: { type: 'integer', minimum: 1, description: 'Em centavos' },
          data: { type: 'string', format: 'date' },
          categoria_id: { type: 'integer', minimum: 1 },
          tipo: { type: 'string', enum: ['entrada', 'saida'] },
        },
      },
      Transacao: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          tipo: { type: 'string', enum: ['entrada', 'saida'] },
          descricao: { type: 'string', example: 'Salário de outubro' },
          valor: { type: 'integer', example: 500000, description: 'Em centavos' },
          data: { type: 'string', format: 'date', example: '2026-10-05' },
          categoria_id: { type: 'integer', example: 14 },
          categoria_nome: { type: 'string', example: 'Salário' },
          criado_em: { type: 'string', format: 'date-time' },
          atualizado_em: { type: 'string', format: 'date-time' },
        },
      },
      ListaDeTransacoes: {
        type: 'object',
        properties: {
          transacoes: { type: 'array', items: ref('Transacao') },
          paginacao: {
            type: 'object',
            properties: {
              pagina: { type: 'integer', example: 1 },
              limite: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 42 },
              total_paginas: { type: 'integer', example: 3 },
            },
          },
        },
      },
      Extrato: {
        type: 'object',
        properties: {
          periodo: {
            type: 'object',
            properties: {
              de: { type: ['string', 'null'], format: 'date' },
              ate: { type: ['string', 'null'], format: 'date' },
            },
          },
          entrada: { type: 'integer', example: 500000 },
          saida: { type: 'integer', example: 12050 },
          saldo: { type: 'integer', example: 487950 },
          por_categoria: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                categoria_id: { type: 'integer' },
                categoria_nome: { type: 'string' },
                tipo: { type: 'string', enum: ['entrada', 'saida'] },
                total: { type: 'integer' },
                quantidade: { type: 'integer' },
              },
            },
          },
        },
      },
      ResumoMensal: {
        type: 'object',
        properties: {
          ano: { type: 'integer', example: 2026 },
          meses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                mes: { type: 'string', example: '2026-10' },
                entrada: { type: 'integer' },
                saida: { type: 'integer' },
                saldo: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/usuarios': {
      post: {
        tags: ['Usuários'],
        summary: 'Cadastrar usuário',
        requestBody: corpo(ref('NovoUsuario'), { nome: 'Ana Souza', email: 'ana@email.com', senha: 'senha-forte-123' }),
        responses: {
          201: resposta('Usuário criado', ref('Usuario')),
          400: dadosInvalidos,
          409: erro('Já existe uma conta com este e-mail'),
        },
      },
    },
    '/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Fazer login e obter o token',
        requestBody: corpo(ref('Credenciais'), { email: 'ana@email.com', senha: 'senha-forte-123' }),
        responses: {
          200: resposta('Login feito', ref('RespostaDeLogin')),
          400: dadosInvalidos,
          401: erro('E-mail ou senha inválidos'),
          429: erro('Muitas tentativas; tente mais tarde'),
        },
      },
    },
    '/usuarios/me': {
      get: {
        tags: ['Usuários'],
        summary: 'Detalhar o usuário logado',
        security: comLogin,
        responses: { 200: resposta('Usuário logado', ref('Usuario')), 401: semLogin },
      },
      patch: {
        tags: ['Usuários'],
        summary: 'Atualizar nome e/ou e-mail',
        security: comLogin,
        requestBody: corpo(ref('AtualizacaoDeUsuario'), { nome: 'Ana Maria Souza' }),
        responses: {
          200: resposta('Usuário atualizado', ref('Usuario')),
          400: dadosInvalidos,
          401: semLogin,
          409: erro('Já existe uma conta com este e-mail'),
        },
      },
      delete: {
        tags: ['Usuários'],
        summary: 'Excluir a própria conta (e todas as transações)',
        security: comLogin,
        responses: { 204: resposta('Conta excluída'), 401: semLogin },
      },
    },
    '/usuarios/me/senha': {
      put: {
        tags: ['Usuários'],
        summary: 'Trocar a senha',
        security: comLogin,
        requestBody: corpo(ref('TrocaDeSenha'), { senha_atual: 'senha-forte-123', nova_senha: 'nova-senha-456' }),
        responses: { 204: resposta('Senha alterada'), 400: dadosInvalidos, 401: semLogin },
      },
    },
    '/categorias': {
      get: {
        tags: ['Categorias'],
        summary: 'Listar categorias',
        security: comLogin,
        responses: {
          200: resposta('Categorias', { type: 'array', items: ref('Categoria') }),
          401: semLogin,
        },
      },
    },
    '/transacoes': {
      get: {
        tags: ['Transações'],
        summary: 'Listar transações (com filtros e paginação)',
        security: comLogin,
        parameters: [
          { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['entrada', 'saida'] } },
          {
            name: 'categoria_id',
            in: 'query',
            description: 'Uma ou mais categorias: ?categoria_id=1,4 ou ?categoria_id=1&categoria_id=4',
            schema: { type: 'string', example: '1,4' },
          },
          ...parametrosDePeriodo,
          { name: 'pagina', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          { name: 'ordem', in: 'query', description: 'Por data', schema: { type: 'string', enum: ['desc', 'asc'], default: 'desc' } },
        ],
        responses: { 200: resposta('Página de transações', ref('ListaDeTransacoes')), 400: dadosInvalidos, 401: semLogin },
      },
      post: {
        tags: ['Transações'],
        summary: 'Cadastrar transação',
        security: comLogin,
        requestBody: corpo(ref('NovaTransacao'), exemploTransacao),
        responses: { 201: resposta('Transação criada', ref('Transacao')), 400: dadosInvalidos, 401: semLogin },
      },
    },
    '/transacoes/extrato': {
      get: {
        tags: ['Transações'],
        summary: 'Extrato: entradas, saídas, saldo e totais por categoria',
        security: comLogin,
        parameters: parametrosDePeriodo,
        responses: { 200: resposta('Extrato', ref('Extrato')), 400: dadosInvalidos, 401: semLogin },
      },
    },
    '/transacoes/resumo-mensal': {
      get: {
        tags: ['Transações'],
        summary: 'Totais mês a mês de um ano (para gráficos)',
        security: comLogin,
        parameters: [{ name: 'ano', in: 'query', description: 'Padrão: ano atual', schema: { type: 'integer' } }],
        responses: { 200: resposta('Resumo do ano', ref('ResumoMensal')), 400: dadosInvalidos, 401: semLogin },
      },
    },
    '/transacoes/{id}': {
      parameters: [parametroId],
      get: {
        tags: ['Transações'],
        summary: 'Detalhar transação',
        security: comLogin,
        responses: { 200: resposta('Transação', ref('Transacao')), 401: semLogin, 404: erro('Transação não encontrada') },
      },
      put: {
        tags: ['Transações'],
        summary: 'Atualizar transação',
        security: comLogin,
        requestBody: corpo(ref('NovaTransacao'), exemploTransacao),
        responses: {
          200: resposta('Transação atualizada', ref('Transacao')),
          400: dadosInvalidos,
          401: semLogin,
          404: erro('Transação não encontrada'),
        },
      },
      delete: {
        tags: ['Transações'],
        summary: 'Excluir transação',
        security: comLogin,
        responses: { 204: resposta('Transação excluída'), 401: semLogin, 404: erro('Transação não encontrada') },
      },
    },
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Verificar se a API e o banco estão no ar',
        responses: {
          200: resposta('Tudo certo', { type: 'object', properties: { status: { type: 'string', example: 'ok' } } }),
          503: resposta('Banco de dados indisponível'),
        },
      },
    },
  },
}
