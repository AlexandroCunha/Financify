import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import { formatarData, formatarMoeda } from '../format.js'
import FormularioTransacao from './FormularioTransacao.jsx'

const FILTROS_VAZIOS = { tipo: '', categoria_id: '', de: '', ate: '' }

export default function Transacoes() {
  const [categorias, setCategorias] = useState([])
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
  const [ordem, setOrdem] = useState('desc')
  const [pagina, setPagina] = useState(1)
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [editando, setEditando] = useState(null) // null | {} (nova) | transação

  useEffect(() => {
    api.categorias().then(setCategorias).catch((e) => setErro(e.message))
  }, [])

  const carregar = useCallback(() => {
    setErro('')
    api
      .transacoes({ ...filtros, pagina, ordem, limite: 10 })
      .then(setDados)
      .catch((e) => setErro(e.message))
  }, [filtros, pagina, ordem])

  useEffect(carregar, [carregar])

  const mudarFiltro = (nome) => (e) => {
    setFiltros({ ...filtros, [nome]: e.target.value })
    setPagina(1)
  }

  async function excluir(t) {
    if (!window.confirm(`Excluir "${t.descricao}"?`)) return
    try {
      await api.excluirTransacao(t.id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const salvou = () => {
    setEditando(null)
    carregar()
  }

  return (
    <>
      <div className="linha-titulo">
        <h2>Transações</h2>
        <button className="primario" onClick={() => setEditando({})}>+ Nova transação</button>
      </div>

      <section className="cartao filtros">
        <select value={filtros.tipo} onChange={mudarFiltro('tipo')} aria-label="Tipo">
          <option value="">Todos os tipos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>
        <select value={filtros.categoria_id} onChange={mudarFiltro('categoria_id')} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
        </select>
        <input type="date" value={filtros.de} onChange={mudarFiltro('de')} aria-label="De" />
        <input type="date" value={filtros.ate} onChange={mudarFiltro('ate')} aria-label="Até" />
        <button onClick={() => setOrdem(ordem === 'desc' ? 'asc' : 'desc')}>
          {ordem === 'desc' ? 'Mais recentes ↓' : 'Mais antigas ↑'}
        </button>
        <button className="link" onClick={() => { setFiltros(FILTROS_VAZIOS); setPagina(1) }}>Limpar</button>
      </section>

      {erro && <div className="alerta erro">{erro}</div>}

      <section className="cartao lista">
        {!dados ? (
          <p className="vazio">Carregando…</p>
        ) : dados.transacoes.length === 0 ? (
          <p className="vazio">Nenhuma transação encontrada.</p>
        ) : (
          <ul>
            {dados.transacoes.map((t) => (
              <li key={t.id}>
                <div className="info">
                  <strong>{t.descricao}</strong>
                  <small>{t.categoria_nome} · {formatarData(t.data)}</small>
                </div>
                <span className={`valor ${t.tipo}`}>{t.tipo === 'saida' ? '−' : '+'} {formatarMoeda(t.valor)}</span>
                <div className="botoes">
                  <button className="link" onClick={() => setEditando(t)}>Editar</button>
                  <button className="link perigo" onClick={() => excluir(t)}>Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dados && dados.paginacao.total_paginas > 1 && (
        <div className="paginacao">
          <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>‹ Anterior</button>
          <span>Página {dados.paginacao.pagina} de {dados.paginacao.total_paginas}</span>
          <button disabled={pagina >= dados.paginacao.total_paginas} onClick={() => setPagina(pagina + 1)}>Próxima ›</button>
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
    </>
  )
}
