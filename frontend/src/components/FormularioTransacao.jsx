import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { categoriasDoTipo } from '../categorias.js'
import { centavosParaTexto, hoje, valorParaCentavos } from '../format.js'

export default function FormularioTransacao({ transacao, categorias, aoSalvar, aoCancelar }) {
  const tipoInicial = transacao?.tipo ?? 'saida'
  const [form, setForm] = useState({
    tipo: tipoInicial,
    descricao: transacao?.descricao ?? '',
    valor: transacao ? centavosParaTexto(transacao.valor) : '',
    data: transacao?.data.slice(0, 10) ?? hoje(),
    categoria_id: transacao?.categoria_id ?? categoriasDoTipo(categorias, tipoInicial)[0]?.id ?? '',
  })
  const [erro, setErro] = useState('')
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && aoCancelar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aoCancelar])

  const mudar = (nome) => (e) => setForm({ ...form, [nome]: e.target.value })

  // Só as categorias do tipo escolhido; ao editar, a categoria atual continua disponível.
  const opcoes = categoriasDoTipo(categorias, form.tipo)
  const atual = categorias.find((c) => String(c.id) === String(form.categoria_id))
  if (atual && !opcoes.includes(atual)) opcoes.push(atual)

  function escolherTipo(tipo) {
    if (tipo === form.tipo) return
    const validas = categoriasDoTipo(categorias, tipo)
    const mantem = validas.some((c) => String(c.id) === String(form.categoria_id))
    setForm({ ...form, tipo, categoria_id: mantem ? form.categoria_id : (validas[0]?.id ?? '') })
  }

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setErros({})
    const valor = valorParaCentavos(form.valor)
    if (!Number.isInteger(valor) || valor < 1) {
      setErros({ valor: 'Informe um valor maior que zero, como 10,50.' })
      return
    }
    const corpo = { ...form, valor, categoria_id: Number(form.categoria_id) }
    setEnviando(true)
    try {
      if (transacao) await api.atualizarTransacao(transacao.id, corpo)
      else await api.criarTransacao(corpo)
      aoSalvar()
    } catch (err) {
      setErro(err.message)
      setErros(err.erros)
      setEnviando(false)
    }
  }

  return (
    <div className="fundo-modal" onMouseDown={(e) => e.target === e.currentTarget && aoCancelar()}>
      <form className="cartao modal largo" role="dialog" aria-modal="true" aria-labelledby="form-titulo" onSubmit={enviar}>
        <h2 id="form-titulo" className="titulo-modal">{transacao ? 'Editar transação' : 'Nova transação'}</h2>
        {erro && <div className="alerta erro">{erro}</div>}

        <div className="alternador" role="group" aria-label="Tipo">
          {['saida', 'entrada'].map((t) => (
            <button type="button" key={t} aria-pressed={form.tipo === t} className={form.tipo === t ? `ativo ${t}` : ''} onClick={() => escolherTipo(t)}>
              {t === 'saida' ? 'Saída' : 'Entrada'}
            </button>
          ))}
        </div>

        <label>
          Descrição
          <input required maxLength={255} placeholder="Supermercado" value={form.descricao} onChange={mudar('descricao')} />
          {erros.descricao && <small className="erro-campo">{erros.descricao}</small>}
        </label>
        <div className="duas-colunas">
          <label>
            Valor (€)
            <input required inputMode="decimal" placeholder="0,00" value={form.valor} onChange={mudar('valor')} />
            {erros.valor && <small className="erro-campo">{erros.valor}</small>}
          </label>
          <label>
            Data
            <input type="date" required value={form.data} onChange={mudar('data')} />
            {erros.data && <small className="erro-campo">{erros.data}</small>}
          </label>
        </div>

        <fieldset className="categorias-chips">
          <legend>Categoria</legend>
          <div>
            {opcoes.map((c) => (
              <label key={c.id} className="chip">
                <input
                  type="radio"
                  name="categoria"
                  value={c.id}
                  checked={String(form.categoria_id) === String(c.id)}
                  onChange={() => setForm({ ...form, categoria_id: c.id })}
                />
                <span>{c.descricao}</span>
              </label>
            ))}
          </div>
          {erros.categoria_id && <small className="erro-campo">{erros.categoria_id}</small>}
        </fieldset>

        <div className="acoes">
          <button type="button" onClick={aoCancelar}>Cancelar</button>
          <button className="primario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}
