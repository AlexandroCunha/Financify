const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const CHAVE_TOKEN = 'financify.token'

export const token = {
  ler: () => localStorage.getItem(CHAVE_TOKEN),
  salvar: (valor) => localStorage.setItem(CHAVE_TOKEN, valor),
  limpar: () => localStorage.removeItem(CHAVE_TOKEN),
}

export class ErroApi extends Error {
  constructor(status, mensagem, erros) {
    super(mensagem)
    this.status = status
    this.erros = erros ?? {}
  }
}

let aoExpirar = () => {}
export const definirAoExpirar = (fn) => (aoExpirar = fn)

async function requisitar(metodo, caminho, { corpo, query } = {}) {
  const url = new URL(BASE + caminho)
  for (const [chave, valor] of Object.entries(query ?? {})) {
    if (valor !== '' && valor != null) url.searchParams.set(chave, valor)
  }
  const cabecalhos = {}
  if (corpo) cabecalhos['Content-Type'] = 'application/json'
  const jwt = token.ler()
  if (jwt) cabecalhos.Authorization = `Bearer ${jwt}`

  let resposta
  try {
    resposta = await fetch(url, { method: metodo, headers: cabecalhos, body: corpo ? JSON.stringify(corpo) : undefined })
  } catch {
    throw new ErroApi(0, 'Não foi possível conectar à API. Verifique se ela está rodando.')
  }

  if (resposta.status === 204) return null
  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    // 401 com sessão ativa = token expirado; no login é só credencial errada.
    if (resposta.status === 401 && jwt) aoExpirar()
    throw new ErroApi(resposta.status, dados.mensagem ?? 'Erro inesperado.', dados.erros)
  }
  return dados
}

export const api = {
  login: (corpo) => requisitar('POST', '/login', { corpo }),
  cadastrar: (corpo) => requisitar('POST', '/usuarios', { corpo }),
  perfil: () => requisitar('GET', '/usuarios/me'),
  atualizarPerfil: (corpo) => requisitar('PATCH', '/usuarios/me', { corpo }),
  alterarSenha: (corpo) => requisitar('PUT', '/usuarios/me/senha', { corpo }),
  excluirConta: () => requisitar('DELETE', '/usuarios/me'),
  categorias: () => requisitar('GET', '/categorias'),
  transacoes: (query) => requisitar('GET', '/transacoes', { query }),
  extrato: (query) => requisitar('GET', '/transacoes/extrato', { query }),
  resumoMensal: (ano) => requisitar('GET', '/transacoes/resumo-mensal', { query: { ano } }),
  criarTransacao: (corpo) => requisitar('POST', '/transacoes', { corpo }),
  atualizarTransacao: (id, corpo) => requisitar('PUT', `/transacoes/${id}`, { corpo }),
  excluirTransacao: (id) => requisitar('DELETE', `/transacoes/${id}`),
}
