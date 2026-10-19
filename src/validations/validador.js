// Validador de dados de entrada, sem dependências externas.
// Cada regra recebe um valor e devolve { valor } (já limpo/convertido) ou { erro }.
const { requisicaoInvalida } = require('../utils/erros')

const ok = (valor) => ({ valor })
const falha = (erro) => ({ erro })

function texto({ min = 1, max = 255, aparar = true, minusculo = false } = {}) {
  return (valor) => {
    if (typeof valor !== 'string') return falha('deve ser um texto')
    let limpo = aparar ? valor.trim() : valor
    if (minusculo) limpo = limpo.toLowerCase()
    if (limpo.length === 0) return falha('não pode ficar vazio')
    if (limpo.length < min) return falha(`deve ter pelo menos ${min} caracteres`)
    if (limpo.length > max) return falha(`deve ter no máximo ${max} caracteres`)
    return ok(limpo)
  }
}

function email() {
  const regraTexto = texto({ max: 254, minusculo: true })
  return (valor) => {
    const resultado = regraTexto(valor)
    if (resultado.erro) return resultado
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resultado.valor) ? resultado : falha('deve ser um e-mail válido')
  }
}

// Senha: sem aparar espaços. O bcrypt considera no máximo 72 bytes.
const senha = ({ min = 8 } = {}) => texto({ min, max: 72, aparar: false })

function inteiro({ min = 1, max = 2_147_483_647, aceitarTexto = false } = {}) {
  return (valor) => {
    let numero = valor
    if (aceitarTexto && typeof valor === 'string' && /^\s*-?\d+\s*$/.test(valor)) numero = Number(valor)
    if (typeof numero !== 'number' || !Number.isInteger(numero)) return falha('deve ser um número inteiro')
    if (numero < min) return falha(`deve ser maior ou igual a ${min}`)
    if (numero > max) return falha(`deve ser menor ou igual a ${max}`)
    return ok(numero)
  }
}

function valorEmCentavos() {
  const regra = inteiro({ min: 1 })
  return (valor) =>
    regra(valor).erro ? falha('deve ser um número inteiro maior que zero, em centavos (ex.: 1050 = € 10,50)') : ok(valor)
}

function data() {
  return (valor) => {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return falha('deve estar no formato AAAA-MM-DD')
    const [ano, mes, dia] = valor.split('-').map(Number)
    const calendario = new Date(Date.UTC(ano, mes - 1, dia))
    const existe =
      calendario.getUTCFullYear() === ano && calendario.getUTCMonth() === mes - 1 && calendario.getUTCDate() === dia
    if (!existe || ano < 1900 || ano > 2999) return falha('não é uma data válida')
    return ok(valor)
  }
}

function opcao(permitidos) {
  return (valor) => (permitidos.includes(valor) ? ok(valor) : falha(`deve ser um destes valores: ${permitidos.join(', ')}`))
}

// Para a query string: aceita "1,2", ?x=1&x=2 ou um único valor, e valida cada item.
function lista(regraDoItem) {
  return (valor) => {
    const itens = [valor]
      .flat()
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean)
    const valores = []
    for (const item of itens) {
      const resultado = regraDoItem(item)
      if (resultado.erro) return falha(`tem um valor inválido ("${item}"): ${resultado.erro}`)
      valores.push(resultado.valor)
    }
    return ok(valores)
  }
}

const opcional = (regra) => ({ opcional: true, regra })

// Junta as regras de cada campo. Campos que não estão no esquema são ignorados.
// - parcial: nenhum campo é obrigatório (útil para PATCH)
// - ignorarVazios: trata "" como ausente (útil para query string)
function esquema(campos, { parcial = false, ignorarVazios = false } = {}) {
  return (entrada) => {
    const origem = entrada !== null && typeof entrada === 'object' && !Array.isArray(entrada) ? entrada : {}
    const dados = {}
    const erros = {}
    for (const [campo, definicao] of Object.entries(campos)) {
      const { opcional: ehOpcional = false, regra } = typeof definicao === 'function' ? { regra: definicao } : definicao
      const valor = origem[campo]
      const ausente = valor === undefined || valor === null || (ignorarVazios && valor === '')
      if (ausente) {
        if (!ehOpcional && !parcial) erros[campo] = 'é obrigatório'
        continue
      }
      const resultado = regra(valor)
      if (resultado.erro) erros[campo] = resultado.erro
      else dados[campo] = resultado.valor
    }
    return { dados, erros }
  }
}

// Valida e devolve os dados limpos, ou lança 400 com os erros de cada campo.
function validar(esquemaDeValidacao, entrada) {
  const { dados, erros } = esquemaDeValidacao(entrada)
  if (Object.keys(erros).length > 0) throw requisicaoInvalida(erros)
  return dados
}

module.exports = {
  texto,
  email,
  senha,
  inteiro,
  valorEmCentavos,
  data,
  opcao,
  lista,
  opcional,
  esquema,
  validar,
}
