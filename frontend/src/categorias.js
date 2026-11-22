// Categorias de saída em ordem de uso mais comum: as primeiras recebem as cores mais distintas.
const SAIDAS = [
  ['Casa', '#12485A'],
  ['Mercado', '#2E8FA0'],
  ['Transporte', '#C9892E'],
  ['Lazer', '#FF7A5C'],
  ['Assinaturas e Serviços', '#8AA3AC'],
  ['Alimentação', '#6C8EAD'],
  ['Saúde', '#B5546B'],
  ['Educação', '#5B8C5A'],
  ['Cuidados Pessoais', '#B7D4DA'],
  ['Família', '#9C7FB8'],
  ['Pets', '#A97C50'],
  ['Presentes', '#D98E73'],
  ['Roupas', '#4F6D7A'],
  ['Outras despesas', '#9AA9AF'],
]

const ENTRADAS = [
  ['Salário', '#0B6E7A'],
  ['Vendas', '#4C9F8E'],
  ['Outras receitas', '#7FB8AE'],
]

const CORES = new Map([...SAIDAS, ...ENTRADAS])
const NOMES_ENTRADA = new Set(ENTRADAS.map(([nome]) => nome))

export const COR_OUTRAS = '#B7D4DA'

// A cor de uma categoria é a mesma no gráfico, na lista e no formulário.
export const corCategoria = (nome) => CORES.get(nome) ?? '#8AA3AC'

// A API não marca o tipo da categoria; estas três são as de receita.
export const categoriasDoTipo = (categorias, tipo) =>
  categorias.filter((c) => NOMES_ENTRADA.has(c.descricao) === (tipo === 'entrada'))
