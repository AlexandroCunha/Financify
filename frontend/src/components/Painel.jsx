import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { corCategoria } from '../categorias.js'
import {
  deslocarMes,
  formatarComSinal,
  formatarData,
  formatarMoeda,
  limitesDoMes,
  mesAtual,
  nomeDoMes,
  rotuloDoMes,
} from '../format.js'
import { GraficoMeses, LinhaResultado, Rosca } from './Graficos.jsx'

// Compara com o mês anterior; sem dados no mês anterior, não há o que comparar.
function comparacao(atual, anterior, mesAnterior, { porcentagem }) {
  if (anterior.entrada + anterior.saida === 0) return ''
  const nome = `em ${nomeDoMes(mesAnterior)}`
  const diferenca = atual - anterior.valor
  if (diferenca === 0) return `Igual ao que foi ${nome}`
  const mais = diferenca > 0 ? 'a mais' : 'a menos'
  if (!porcentagem) return `${formatarMoeda(Math.abs(diferenca))} ${mais} que ${nome}`
  if (anterior.valor === 0) return ''
  return `${Math.round((Math.abs(diferenca) / anterior.valor) * 100)}% ${mais} que ${nome}`
}

export default function Painel({ aoNovaTransacao, aoVerTransacoes }) {
  const [mes, setMes] = useState(mesAtual())
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const ano = Number(mes.slice(0, 4))
  const mesAnterior = deslocarMes(mes, -1)

  useEffect(() => {
    let cancelado = false
    setErro('')
    Promise.all([
      api.extrato(limitesDoMes(mes)),
      api.extrato(limitesDoMes(mesAnterior)),
      api.resumoMensal(ano),
      api.transacoes({ ...limitesDoMes(mes), limite: 5, ordem: 'desc' }),
    ])
      .then(([extrato, anterior, resumo, recentes]) => {
        if (!cancelado) setDados({ extrato, anterior, resumo, recentes: recentes.transacoes })
      })
      .catch((err) => !cancelado && setErro(err.message))
    return () => {
      cancelado = true
    }
  }, [mes, mesAnterior, ano])

  const seletor = (
    <div className="seletor-mes">
      <button className="redondo" aria-label="Mês anterior" onClick={() => setMes(mesAnterior)}>‹</button>
      <h1 className="titulo-pagina">{rotuloDoMes(mes)}</h1>
      <button className="redondo" aria-label="Próximo mês" onClick={() => setMes(deslocarMes(mes, 1))}>›</button>
    </div>
  )

  const cabecalho = (
    <div className="linha-titulo">
      {seletor}
      <button className="primario" onClick={aoNovaTransacao}>Nova transação</button>
    </div>
  )

  if (erro) return <>{cabecalho}<div className="alerta erro">{erro}</div></>
  if (!dados) return <>{cabecalho}<p className="vazio">Carregando…</p></>

  const { extrato, anterior, resumo, recentes } = dados
  const vazio = extrato.entrada + extrato.saida === 0
  const gastos = extrato.por_categoria.filter((c) => c.tipo === 'saida').sort((a, b) => b.total - a.total)
  const destaque = Number(mes.slice(5, 7)) - 1

  return (
    <>
      {cabecalho}

      <section className="faixa">
        <div className="indicador principal">
          <span>Saldo do mês</span>
          <strong className={extrato.saldo < 0 ? 'negativo' : ''}>
            {extrato.saldo < 0 ? formatarComSinal(extrato.saldo) : formatarMoeda(extrato.saldo)}
          </strong>
          <small>{comparacao(extrato.saldo, { ...anterior, valor: anterior.saldo }, mesAnterior, { porcentagem: false })}</small>
        </div>
        <div className="indicador">
          <span>Entradas</span>
          <strong className="positivo">+ {formatarMoeda(extrato.entrada)}</strong>
          <small>{comparacao(extrato.entrada, { ...anterior, valor: anterior.entrada }, mesAnterior, { porcentagem: true })}</small>
        </div>
        <div className="indicador">
          <span>Saídas</span>
          <strong className="negativo">− {formatarMoeda(extrato.saida)}</strong>
          <small>{comparacao(extrato.saida, { ...anterior, valor: anterior.saida }, mesAnterior, { porcentagem: true })}</small>
        </div>
      </section>

      {vazio && (
        <section className="cartao convite">
          <h2>Nada registrado em {nomeDoMes(mes)}</h2>
          <p>Registre uma entrada ou uma saída para ver o saldo e os gastos por categoria deste mês.</p>
          <button className="primario" onClick={aoNovaTransacao}>Nova transação</button>
        </section>
      )}

      <div className="grade-graficos">
        <section className="cartao largo">
          <div className="linha-titulo">
            <h2>Mês a mês</h2>
            <div className="legenda">
              <span><i className="ponto entrada" /> Entradas</span>
              <span><i className="ponto saida" /> Saídas</span>
            </div>
          </div>
          <GraficoMeses meses={resumo.meses} ano={ano} destaque={destaque} />
        </section>

        <section className="cartao">
          <h2>Gastos por categoria</h2>
          {gastos.length === 0 ? (
            <p className="vazio">Nenhuma saída neste mês.</p>
          ) : (
            <Rosca gastos={gastos} total={extrato.saida} />
          )}
        </section>
      </div>

      <div className="grade-graficos inverso">
        <section className="cartao largo">
          <h2>Quanto sobrou em cada mês</h2>
          <p className="descricao">Entradas menos saídas em {ano}</p>
          <LinhaResultado meses={resumo.meses} ano={ano} />
        </section>

        <section className="cartao">
          <div className="linha-titulo">
            <h2>Últimas transações</h2>
            <button className="link" onClick={aoVerTransacoes}>Ver todas</button>
          </div>
          {recentes.length === 0 ? (
            <p className="vazio">Sem transações em {nomeDoMes(mes)}.</p>
          ) : (
            <ul className="mini-lista">
              {recentes.map((t) => (
                <li key={t.id}>
                  <i className="quadrado" style={{ background: corCategoria(t.categoria_nome) }} />
                  <div className="info">
                    <strong>{t.descricao}</strong>
                    <small>{t.categoria_nome} · {formatarData(t.data)}</small>
                  </div>
                  <span className={`valor ${t.tipo}`}>{t.tipo === 'saida' ? '−' : '+'} {formatarMoeda(t.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
