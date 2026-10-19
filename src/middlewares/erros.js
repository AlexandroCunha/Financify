const { ErroHttp } = require('../utils/erros')

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ mensagem: `Rota não encontrada: ${req.method} ${req.path}` })
}

// Último middleware: transforma qualquer erro em uma resposta JSON padronizada { mensagem, erros? }.
function tratarErros(erro, req, res, next) {
  if (res.headersSent) return next(erro)

  if (erro instanceof ErroHttp) {
    const corpo = { mensagem: erro.message }
    if (erro.detalhes) corpo.erros = erro.detalhes
    return res.status(erro.status).json(corpo)
  }

  // Erros do express.json(): JSON malformado, corpo grande demais, charset não suportado...
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'O corpo da requisição não é um JSON válido.' })
  }
  if (erro.type === 'entity.too.large') {
    return res.status(413).json({ mensagem: 'O corpo da requisição é grande demais.' })
  }
  if (Number.isInteger(erro.status) && erro.status >= 400 && erro.status < 500) {
    return res.status(erro.status).json({ mensagem: erro.expose ? erro.message : 'Requisição inválida.' })
  }

  // Erro inesperado: registra tudo no log, mas não expõe detalhes internos na resposta.
  console.error(`[erro] ${req.method} ${req.originalUrl}`, erro)
  res.status(500).json({ mensagem: 'Erro interno do servidor.' })
}

module.exports = { rotaNaoEncontrada, tratarErros }
