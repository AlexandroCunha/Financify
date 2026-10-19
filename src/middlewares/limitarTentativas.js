const { muitasRequisicoes } = require('../utils/erros')

// Limite de requisições por IP numa janela de tempo, guardado em memória.
// Suficiente para uma instância só; com várias instâncias, troque por um armazenamento compartilhado (ex.: Redis).
function limitarTentativas({ maximo, janelaMs = 15 * 60 * 1000, mensagem = 'Muitas requisições. Tente mais tarde.' }) {
  const contagens = new Map()

  const faxina = setInterval(() => {
    const agora = Date.now()
    for (const [ip, registro] of contagens) {
      if (registro.expiraEm <= agora) contagens.delete(ip)
    }
  }, janelaMs)
  faxina.unref()

  return (req, res, next) => {
    const agora = Date.now()
    let registro = contagens.get(req.ip)
    if (!registro || registro.expiraEm <= agora) {
      registro = { total: 0, expiraEm: agora + janelaMs }
      contagens.set(req.ip, registro)
    }
    registro.total += 1

    res.set('RateLimit-Limit', String(maximo))
    res.set('RateLimit-Remaining', String(Math.max(0, maximo - registro.total)))
    if (registro.total > maximo) {
      res.set('Retry-After', String(Math.ceil((registro.expiraEm - agora) / 1000)))
      throw muitasRequisicoes(mensagem)
    }
    next()
  }
}

module.exports = limitarTentativas
