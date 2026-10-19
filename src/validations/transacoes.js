const { esquema, texto, inteiro, valorEmCentavos, data, opcao, lista, opcional } = require('./validador')

const TIPOS = ['entrada', 'saida']

const transacao = esquema({
  descricao: texto({ max: 255 }),
  valor: valorEmCentavos(),
  data: data(),
  categoria_id: inteiro(),
  tipo: opcao(TIPOS),
})

const parametroId = esquema({
  id: inteiro({ aceitarTexto: true }),
})

const filtrosDaListagem = esquema(
  {
    tipo: opcional(opcao(TIPOS)),
    categoria_id: opcional(lista(inteiro({ aceitarTexto: true }))),
    de: opcional(data()),
    ate: opcional(data()),
    pagina: opcional(inteiro({ aceitarTexto: true })),
    limite: opcional(inteiro({ max: 100, aceitarTexto: true })),
    ordem: opcional(opcao(['asc', 'desc'])),
  },
  { ignorarVazios: true },
)

const periodo = esquema(
  {
    de: opcional(data()),
    ate: opcional(data()),
  },
  { ignorarVazios: true },
)

const resumoMensal = esquema(
  {
    ano: opcional(inteiro({ min: 1900, max: 2999, aceitarTexto: true })),
  },
  { ignorarVazios: true },
)

module.exports = { transacao, parametroId, filtrosDaListagem, periodo, resumoMensal }
