import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { formatarMoeda, NOMES_MESES } from '../format.js'

function Grafico({ meses }) {
  const maximo = Math.max(1, ...meses.flatMap((m) => [m.entrada, m.saida]))
  return (
    <div className="grafico" role="img" aria-label="Entradas e saídas por mês">
      {meses.map((m, i) => (
        <div className="coluna" key={m.mes} title={`${NOMES_MESES[i]}: entradas ${formatarMoeda(m.entrada)}, saídas ${formatarMoeda(m.saida)}`}>
          <div className="barras">
            <div className="barra entrada" style={{ height: `${(m.entrada / maximo) * 100}%` }} />
            <div className="barra saida" style={{ height: `${(m.saida / maximo) * 100}%` }} />
          </div>
          <span>{NOMES_MESES[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function Painel() {
  const [ano, setAno] = useState(new Date().getFullYear())
  const [extrato, setExtrato] = useState(null)
  const [resumo, setResumo] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    setErro('')
    Promise.all([api.extrato(), api.resumoMensal(ano)])
      .then(([e, r]) => {
        setExtrato(e)
        setResumo(r)
      })
      .catch((err) => setErro(err.message))
  }, [ano])

  if (erro) return <div className="alerta erro">{erro}</div>
  if (!extrato || !resumo) return <p className="vazio">Carregando…</p>

  const gastos = extrato.por_categoria.filter((c) => c.tipo === 'saida').sort((a, b) => b.total - a.total)
  const totalGastos = gastos.reduce((s, c) => s + c.total, 0)

  return (
    <>
      <section className="cards">
        <div className="cartao indicador">
          <span>Saldo</span>
          <strong className={extrato.saldo < 0 ? 'negativo' : ''}>{formatarMoeda(extrato.saldo)}</strong>
        </div>
        <div className="cartao indicador">
          <span>Entradas</span>
          <strong className="positivo">{formatarMoeda(extrato.entrada)}</strong>
        </div>
        <div className="cartao indicador">
          <span>Saídas</span>
          <strong className="negativo">{formatarMoeda(extrato.saida)}</strong>
        </div>
      </section>

      <section className="cartao">
        <div className="linha-titulo">
          <h2>Mês a mês</h2>
          <div className="seletor-ano">
            <button className="icone" aria-label="Ano anterior" onClick={() => setAno(ano - 1)}>‹</button>
            <span>{ano}</span>
            <button className="icone" aria-label="Próximo ano" onClick={() => setAno(ano + 1)}>›</button>
          </div>
        </div>
        <div className="legenda">
          <span><i className="ponto entrada" /> Entradas</span>
          <span><i className="ponto saida" /> Saídas</span>
        </div>
        <Grafico meses={resumo.meses} />
      </section>

      <section className="cartao">
        <h2>Gastos por categoria</h2>
        {gastos.length === 0 ? (
          <p className="vazio">Nenhuma saída registrada ainda.</p>
        ) : (
          <ul className="categorias">
            {gastos.map((c) => (
              <li key={c.categoria_id}>
                <div className="linha">
                  <span>{c.categoria_nome} <small>({c.quantidade})</small></span>
                  <strong>{formatarMoeda(c.total)}</strong>
                </div>
                <div className="trilho"><div style={{ width: `${(c.total / totalGastos) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
