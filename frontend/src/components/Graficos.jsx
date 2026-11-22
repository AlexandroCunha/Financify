import { COR_OUTRAS, corCategoria } from '../categorias.js'
import { formatarMoeda, formatarMoedaInteira, formatarPercentual, NOMES_MESES } from '../format.js'

// Arredonda o teto do eixo para um número "redondo" (1, 2, 2,5, 5 × 10^n), em centavos.
export function escalaBonita(centavos) {
  const euros = Math.max(centavos / 100, 1)
  const magnitude = 10 ** Math.floor(Math.log10(euros))
  const passo = [1, 2, 2.5, 5, 10].map((p) => p * magnitude).find((v) => v >= euros) ?? 10 * magnitude
  return Math.round(passo * 100)
}

export function GraficoMeses({ meses, ano, destaque }) {
  const maximo = Math.max(0, ...meses.flatMap((m) => [m.entrada, m.saida]))
  const teto = escalaBonita(maximo)
  const doMes =
    destaque == null
      ? ''
      : ` ${NOMES_MESES[destaque]}: entradas de ${formatarMoeda(meses[destaque].entrada)} e saídas de ${formatarMoeda(meses[destaque].saida)}.`

  return (
    <div
      className={`grafico-meses${destaque == null ? '' : ' com-destaque'}`}
      role="img"
      aria-label={`Entradas e saídas de cada mês de ${ano}.${doMes}`}
    >
      <div className="eixo" aria-hidden="true">
        {[1, 0.5, 0].map((f) => (
          <span key={f} style={{ bottom: `${f * 100}%` }}>{formatarMoedaInteira(teto * f)}</span>
        ))}
      </div>
      <div className="plano" aria-hidden="true">
        {[0.5, 1].map((f) => (
          <i key={f} className="grade" style={{ bottom: `${f * 100}%` }} />
        ))}
        <div className="colunas">
          {meses.map((m, i) => (
            <div
              key={m.mes}
              className={`coluna${i === destaque ? ' destaque' : ''}`}
              title={`${NOMES_MESES[i]}: entradas ${formatarMoeda(m.entrada)}, saídas ${formatarMoeda(m.saida)}`}
            >
              <div className="barra entrada" style={{ height: `${(m.entrada / teto) * 100}%` }} />
              <div className="barra saida" style={{ height: `${(m.saida / teto) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="rotulos" aria-hidden="true">
        {NOMES_MESES.map((nome, i) => (
          <span key={nome} className={i === destaque ? 'destaque' : ''}>{nome}</span>
        ))}
      </div>
    </div>
  )
}

// As cinco maiores categorias e o restante agrupado em "Outras".
export function Rosca({ gastos, total }) {
  const topo = gastos.slice(0, 5).map((c) => ({ nome: c.categoria_nome, total: c.total, cor: corCategoria(c.categoria_nome) }))
  const resto = gastos.slice(5).reduce((soma, c) => soma + c.total, 0)
  const fatias = resto > 0 ? [...topo, { nome: 'Outras', total: resto, cor: COR_OUTRAS }] : topo

  let acumulado = 0
  const paradas = fatias.map((f) => {
    const inicio = acumulado
    acumulado += (f.total / total) * 100
    return `${f.cor} ${inicio}% ${acumulado}%`
  })
  const descricao = fatias.map((f) => `${f.nome} ${formatarPercentual(f.total / total)}`).join(', ')

  return (
    <div className="rosca-bloco">
      <div className="rosca" style={{ background: `conic-gradient(${paradas.join(', ')})` }} role="img" aria-label={`Saídas por categoria: ${descricao}.`}>
        <div className="rosca-centro">
          <span>Saídas</span>
          <strong>{formatarMoedaInteira(total)}</strong>
        </div>
      </div>
      <ul className="legenda-lista">
        {fatias.map((f) => (
          <li key={f.nome} title={formatarMoeda(f.total)}>
            <i className="quadrado" style={{ background: f.cor }} />
            <span>{f.nome}</span>
            <small>{formatarPercentual(f.total / total)}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}

const LARGURA = 480
const ESQUERDA = 44
const CELULA = (LARGURA - ESQUERDA) / 12
const TOPO = 24
const ALTURA = 120

// Resultado de cada mês (entradas menos saídas) como linha, do primeiro mês até o último com dados.
export function LinhaResultado({ meses, ano }) {
  const ultimo = meses.reduce((u, m, i) => (m.entrada || m.saida ? i : u), -1)
  if (ultimo < 1) {
    return <p className="vazio">Com transações em dois meses ou mais, a linha aparece aqui.</p>
  }

  const resultados = meses.slice(0, ultimo + 1).map((m) => m.entrada - m.saida)
  const alto = Math.max(0, ...resultados) > 0 ? escalaBonita(Math.max(...resultados)) : 0
  const baixo = Math.min(0, ...resultados) < 0 ? -escalaBonita(-Math.min(...resultados)) : 0
  const faixa = alto - baixo || 1
  const y = (v) => TOPO + ((alto - v) / faixa) * ALTURA
  const x = (i) => ESQUERDA + CELULA * i + CELULA / 2

  const pontos = resultados.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const area = `${pontos.join(' ')} ${x(ultimo).toFixed(1)},${y(0).toFixed(1)} ${x(0).toFixed(1)},${y(0).toFixed(1)}`
  const referencias = [...new Set([alto, 0, baixo])]

  const iMax = resultados.indexOf(Math.max(...resultados))
  const iMin = resultados.indexOf(Math.min(...resultados))
  const descricao = `Resultado de cada mês de ${ano}. Maior: ${NOMES_MESES[iMax]}, ${formatarMoeda(resultados[iMax])}. Menor: ${NOMES_MESES[iMin]}, ${formatarMoeda(resultados[iMin])}.`

  return (
    <>
      <svg viewBox={`0 0 ${LARGURA} ${TOPO + ALTURA + 8}`} className="linha-svg" role="img" aria-label={descricao}>
        <defs>
          <marker id="ponto-resultado" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="6" refY="6">
            <circle cx="6" cy="6" r="4" fill="var(--cartao)" stroke="var(--entrada)" strokeWidth="2" />
          </marker>
        </defs>
        {referencias.map((v) => (
          <g key={v}>
            <line x1={ESQUERDA} x2={LARGURA} y1={y(v)} y2={y(v)} stroke={v === 0 ? 'var(--campo-borda)' : 'var(--borda)'} />
            <text x="0" y={y(v) + 4} fontSize="11" fill="var(--suave)">{formatarMoedaInteira(v)}</text>
          </g>
        ))}
        <polygon points={area} fill="var(--entrada)" fillOpacity="0.1" />
        <polyline
          points={pontos.join(' ')}
          fill="none"
          stroke="var(--entrada)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          markerStart="url(#ponto-resultado)"
          markerMid="url(#ponto-resultado)"
          markerEnd="url(#ponto-resultado)"
        />
      </svg>
      <div className="rotulos linha-rotulos" aria-hidden="true">
        {NOMES_MESES.map((nome) => (
          <span key={nome}>{nome}</span>
        ))}
      </div>
    </>
  )
}
