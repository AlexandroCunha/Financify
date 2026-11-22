import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import { corCategoria } from '../categorias.js'
import { formatarMoeda, rotuloDoDia } from '../format.js'
import Confirmar from './Confirmar.jsx'
import FormularioTransacao from './FormularioTransacao.jsx'

const FILTROS_VAZIOS = { tipo: '', categoria_id: '', de: '', ate: '' }
const POR_PAGINA = 10

// A lista já vem ordenada; agrupa transações seguidas do mesmo dia.
function agruparPorDia(transacoes) {
  const grupos = []
  for (const t of transacoes) {
    const dia = t.data.slice(0, 10)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.dia === dia) ultimo.itens.push(t)
    else grupos.push({ dia, itens: [t] })
  }
  return grupos
}

export default function Transacoes({ abrirNova = false }) {
  const [categorias, setCategorias] = useState([])
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
  const [ordem, setOrdem] = useState('desc')
  const [pagina, setPagina] = useState(1)
  const [dados, setDados] = useState(null)
  const [periodo, setPeriodo] = useState(null)
  const [erro, setErro] = useState('')
  const [editando, setEditando] = useState(abrirNova ? {} : null) // null | {} (nova) | transação
  const [excluindo, setExcluindo] = useState(null)
  const [excluindoEnviando, setExcluindoEnviando] = useState(false)

  useEffect(() => {
    api.categorias().then(setCategorias).catch((e) => setErro(e.message))
  }, [])

  const carregar = useCallback(() => {
    setErro('')
    api
      .transacoes({ ...filtros, pagina, ordem, limite: POR_PAGINA })
      .then(setDados)
      .catch((e) => setErro(e.message))
  }, [filtros, pagina, ordem])

  useEffect(carregar, [carregar])

  // O extrato só filtra por período; com filtro de tipo ou categoria o total não bateria com a lista.
  const filtrandoPorTipoOuCategoria = Boolean(filtros.tipo || filtros.categoria_id)
  const recarregarPeriodo = useCallback(() => {
    if (filtrandoPorTipoOuCategoria) return setPeriodo(null)
    api
      .extrato({ de: filtros.de, ate: filtros.ate })
      .then(setPeriodo)
      .catch(() => setPeriodo(null))
  }, [filtros.de, filtros.ate, filtrandoPorTipoOuCategoria])

  useEffect(recarregarPeriodo, [recarregarPeriodo])

  const atualizar = () => {
    carregar()
    recarregarPeriodo()
  }

  const mudarFiltro = (nome) => (e) => {
    setFiltros({ ...filtros, [nome]: e.target.value })
    setPagina(1)
  }

  async function excluir() {
    setExcluindoEnviando(true)
    try {
      await api.excluirTransacao(excluindo.id)
      setExcluindo(null)
      atualizar()
    } catch (e) {
      setExcluindo(null)
      setErro(e.message)
    } finally {
      setExcluindoEnviando(false)
    }
  }

  const salvou = () => {
    setEditando(null)
    atualizar()
  }

  const total = periodo ? periodo.entrada + periodo.saida : 0

  return (
    <>
      <div className="linha-titulo">
        <h1 className="titulo-pagina">Transações</h1>
        <button className="primario" onClick={() => setEditando({})}>Nova transação</button>
      </div>

      <section className="cartao filtros">
        <label>
          Tipo
          <select value={filtros.tipo} onChange={mudarFiltro('tipo')}>
            <option value="">Todos os tipos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </label>
        <label>
          Categoria
          <select value={filtros.categoria_id} onChange={mudarFiltro('categoria_id')}>
            <option value="">Todas as categorias</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
          </select>
        </label>
        <label>
          De
          <input type="date" value={filtros.de} onChange={mudarFiltro('de')} />
        </label>
        <label>
          Até
          <input type="date" value={filtros.ate} onChange={mudarFiltro('ate')} />
        </label>
        <label>
          Ordem
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigas</option>
          </select>
        </label>
        <button className="link" onClick={() => { setFiltros(FILTROS_VAZIOS); setPagina(1) }}>Limpar filtros</button>
      </section>

      {erro && <div className="alerta erro">{erro}</div>}

      {periodo && total > 0 && (
        <section className="cartao resumo-periodo">
          <div className="resumo-linha">
            <span>Entradas <strong className="positivo">+ {formatarMoeda(periodo.entrada)}</strong></span>
            {dados && <small>{dados.paginacao.total} transações</small>}
            <span>Saídas <strong className="negativo">− {formatarMoeda(periodo.saida)}</strong></span>
          </div>
          <div
            className="proporcao"
            role="img"
            aria-label={`Entradas são ${Math.round((periodo.entrada / total) * 100)}% e saídas ${Math.round((periodo.saida / total) * 100)}% do movimento do período.`}
          >
            <div className="barra entrada" style={{ width: `${(periodo.entrada / total) * 100}%` }} />
            <div className="barra saida" style={{ width: `${(periodo.saida / total) * 100}%` }} />
          </div>
        </section>
      )}

      <section className="cartao lista">
        {!dados ? (
          <p className="vazio">Carregando…</p>
        ) : dados.transacoes.length === 0 ? (
          <p className="vazio">Nenhuma transação encontrada com esses filtros.</p>
        ) : (
          agruparPorDia(dados.transacoes).map((grupo) => (
            <div key={grupo.dia}>
              <h2 className="dia">{rotuloDoDia(grupo.dia)}</h2>
              <ul>
                {grupo.itens.map((t) => (
                  <li key={t.id}>
                    <i className="quadrado" style={{ background: corCategoria(t.categoria_nome) }} />
                    <div className="info">
                      <strong>{t.descricao}</strong>
                      <small>{t.categoria_nome}</small>
                    </div>
                    <div className="botoes">
                      <button className="link" onClick={() => setEditando(t)}>Editar</button>
                      <button className="link perigo" onClick={() => setExcluindo(t)}>Excluir</button>
                    </div>
                    <span className={`valor ${t.tipo}`}>{t.tipo === 'saida' ? '−' : '+'} {formatarMoeda(t.valor)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {dados && dados.paginacao.total_paginas > 1 && (
        <div className="paginacao">
          <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span>Página {dados.paginacao.pagina} de {dados.paginacao.total_paginas}</span>
          <button disabled={pagina >= dados.paginacao.total_paginas} onClick={() => setPagina(pagina + 1)}>Próxima</button>
        </div>
      )}

      {editando && (
        <FormularioTransacao
          transacao={editando.id ? editando : null}
          categorias={categorias}
          aoSalvar={salvou}
          aoCancelar={() => setEditando(null)}
        />
      )}

      {excluindo && (
        <Confirmar
          titulo="Excluir transação?"
          texto={`“${excluindo.descricao}”, de ${formatarMoeda(excluindo.valor)}, será apagada. Não dá para desfazer.`}
          rotuloConfirmar="Excluir"
          perigo
          enviando={excluindoEnviando}
          aoConfirmar={excluir}
          aoCancelar={() => setExcluindo(null)}
        />
      )}
    </>
  )
}
