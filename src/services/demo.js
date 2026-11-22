const crypto = require('node:crypto')
const bcrypt = require('bcrypt')
const demo = require('../repositories/demo')
const { gerarToken } = require('./autenticacao')

// A conta de demonstração vive 24 horas; o login dela dura 2 (depois, é só pedir outra).
const HORAS_DE_VIDA = 24
const DURACAO_DO_LOGIN = '2h'
const MESES_COM_DADOS = 4 // os 3 meses anteriores e o mês atual

// Gastos de um mês típico. dia: dia do mês; valor: em centavos de euro.
const MES_TIPICO = [
  { dia: 1, descricao: 'Salário', valor: 325000, tipo: 'entrada', categoria: 'Salário' },
  { dia: 1, descricao: 'Aluguel', valor: 95000, tipo: 'saida', categoria: 'Casa' },
  { dia: 3, descricao: 'Passe mensal de transporte', valor: 9000, tipo: 'saida', categoria: 'Transporte' },
  { dia: 4, descricao: 'Supermercado', valor: 8740, tipo: 'saida', categoria: 'Mercado' },
  { dia: 6, descricao: 'Streaming de música', valor: 1199, tipo: 'saida', categoria: 'Assinaturas e Serviços' },
  { dia: 8, descricao: 'Almoço com colegas', valor: 2450, tipo: 'saida', categoria: 'Alimentação' },
  { dia: 11, descricao: 'Supermercado', valor: 6320, tipo: 'saida', categoria: 'Mercado' },
  { dia: 12, descricao: 'Internet', valor: 3999, tipo: 'saida', categoria: 'Assinaturas e Serviços' },
  { dia: 14, descricao: 'Farmácia', valor: 1850, tipo: 'saida', categoria: 'Saúde' },
  { dia: 16, descricao: 'Cinema', valor: 2400, tipo: 'saida', categoria: 'Lazer' },
  { dia: 18, descricao: 'Supermercado', valor: 7110, tipo: 'saida', categoria: 'Mercado' },
  { dia: 20, descricao: 'Projeto freelance', valor: 45000, tipo: 'entrada', categoria: 'Vendas', aCadaDoisMeses: true },
  { dia: 22, descricao: 'Jantar fora', valor: 5600, tipo: 'saida', categoria: 'Alimentação' },
  { dia: 25, descricao: 'Supermercado', valor: 5480, tipo: 'saida', categoria: 'Mercado' },
  { dia: 27, descricao: 'Curso online', valor: 2900, tipo: 'saida', categoria: 'Educação', aCadaDoisMeses: true },
]

const doisDigitos = (n) => String(n).padStart(2, '0')

// Transações de exemplo dos últimos meses, até hoje (nada no futuro).
// Os valores variam um pouco de mês para mês, para o gráfico não ficar reto.
function transacoesDeExemplo(hoje = new Date()) {
  const transacoes = []
  for (let atras = MESES_COM_DADOS - 1; atras >= 0; atras -= 1) {
    const referencia = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - atras, 1))
    const ano = referencia.getUTCFullYear()
    const mes = referencia.getUTCMonth()
    const variacao = 1 + ((mes % 3) - 1) * 0.06
    for (const item of MES_TIPICO) {
      if (item.aCadaDoisMeses && mes % 2 === 1) continue
      if (atras === 0 && item.dia > hoje.getUTCDate()) continue
      const fixo = item.tipo === 'entrada' || item.categoria === 'Casa' || item.categoria === 'Assinaturas e Serviços'
      transacoes.push({
        descricao: item.descricao,
        valor: fixo ? item.valor : Math.round(item.valor * variacao),
        data: `${ano}-${doisDigitos(mes + 1)}-${doisDigitos(item.dia)}`,
        tipo: item.tipo,
        categoria: item.categoria,
      })
    }
  }
  return transacoes
}

async function criarContaDemo() {
  const id = crypto.randomBytes(8).toString('hex')
  // Senha aleatória que ninguém conhece: a conta só é acessada pelo token devolvido aqui.
  const senhaHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10)
  const usuario = await demo.criarComTransacoes({
    nome: 'Conta demo',
    email: `demo-${id}@financify.invalid`,
    senhaHash,
    transacoes: transacoesDeExemplo(),
    horasDeVida: HORAS_DE_VIDA,
  })
  return {
    usuario,
    token: gerarToken(usuario.id, { expiraEm: DURACAO_DO_LOGIN }),
    expira_em_horas: HORAS_DE_VIDA,
  }
}

module.exports = { criarContaDemo, transacoesDeExemplo, HORAS_DE_VIDA }
