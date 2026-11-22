const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR' })
const moedaInteira = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const percentual = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const formatarMoeda = (centavos) => moeda.format(centavos / 100)
export const formatarMoedaInteira = (centavos) => moedaInteira.format(centavos / 100)
export const formatarPercentual = (fracao) => percentual.format(fracao)

// "+ € 10,00" / "− € 10,00": o mesmo formato do painel à lista de transações.
export const formatarComSinal = (centavos) => `${centavos < 0 ? '−' : '+'} ${formatarMoeda(Math.abs(centavos))}`

// "2026-10-19" -> "19/10/2026" (sem passar por Date, para não sofrer com fuso horário)
export const formatarData = (iso) => iso.slice(0, 10).split('-').reverse().join('/')

export const hoje = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// "10,50" / "1.050,25" (euros) -> 1050 / 105025 centavos; NaN se inválido
export function valorParaCentavos(texto) {
  const limpo = String(texto).trim().replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return NaN
  return Math.round(parseFloat(limpo) * 100)
}

export const centavosParaTexto = (centavos) => (centavos / 100).toFixed(2).replace('.', ',')

export const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1)

// Meses são "AAAA-MM".
export const mesAtual = () => hoje().slice(0, 7)

export function deslocarMes(mes, delta) {
  const [ano, numero] = mes.split('-').map(Number)
  const indice = ano * 12 + (numero - 1) + delta
  return `${Math.floor(indice / 12)}-${String((indice % 12) + 1).padStart(2, '0')}`
}

export function limitesDoMes(mes) {
  const [ano, numero] = mes.split('-').map(Number)
  const ultimo = new Date(ano, numero, 0).getDate()
  return { de: `${mes}-01`, ate: `${mes}-${String(ultimo).padStart(2, '0')}` }
}

export const nomeDoMes = (mes) => MESES_LONGOS[Number(mes.slice(5, 7)) - 1]
export const rotuloDoMes = (mes) => `${capitalizar(nomeDoMes(mes))} de ${mes.slice(0, 4)}`

// "2026-11-22" -> "Domingo, 22 de novembro" (UTC, para o dia não mudar com o fuso)
export const rotuloDoDia = (iso) =>
  capitalizar(
    new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }),
  )
