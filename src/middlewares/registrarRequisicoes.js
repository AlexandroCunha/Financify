// Log de cada requisição: método, rota, status e tempo de resposta.
function registrarRequisicoes(req, res, next) {
  const inicio = performance.now()
  res.on('finish', () => {
    const duracao = (performance.now() - inicio).toFixed(1)
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${duracao}ms`)
  })
  next()
}

module.exports = registrarRequisicoes
