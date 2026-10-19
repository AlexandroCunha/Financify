const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR' })

export const formatarMoeda = (centavos) => moeda.format(centavos / 100)

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
