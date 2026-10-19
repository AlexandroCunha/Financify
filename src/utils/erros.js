// Erro com status HTTP. Lançado pelas camadas da aplicação e convertido em resposta
// JSON pelo middleware de erros (src/middlewares/erros.js).
class ErroHttp extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem)
    this.name = 'ErroHttp'
    this.status = status
    this.detalhes = detalhes
  }
}

const requisicaoInvalida = (detalhes, mensagem = 'Dados inválidos.') => new ErroHttp(400, mensagem, detalhes)
const naoAutorizado = (mensagem = 'Não autorizado.') => new ErroHttp(401, mensagem)
const naoEncontrado = (mensagem = 'Recurso não encontrado.') => new ErroHttp(404, mensagem)
const conflito = (mensagem) => new ErroHttp(409, mensagem)
const muitasRequisicoes = (mensagem) => new ErroHttp(429, mensagem)

module.exports = {
  ErroHttp,
  requisicaoInvalida,
  naoAutorizado,
  naoEncontrado,
  conflito,
  muitasRequisicoes,
}
