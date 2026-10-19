import { useState } from 'react'
import { api } from '../api.js'
import { centavosParaReais, hoje, reaisParaCentavos } from '../format.js'

export default function FormularioTransacao({ transacao, categorias, aoSalvar, aoCancelar }) {
  const [form, setForm] = useState({
    tipo: transacao?.tipo ?? 'saida',
    descricao: transacao?.descricao ?? '',
    valor: transacao ? centavosParaReais(transacao.valor) : '',
    data: transacao?.data.slice(0, 10) ?? hoje(),
    categoria_id: transacao?.categoria_id ?? categorias[0]?.id ?? '',
  })
  const [erro, setErro] = useState('')
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)

  const mudar = (nome) => (e) => setForm({ ...form, [nome]: e.target.value })

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setErros({})
    const valor = reaisParaCentavos(form.valor)
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
      <form className="cartao modal" onSubmit={enviar}>
        <h2>{transacao ? 'Editar transação' : 'Nova transação'}</h2>
        {erro && <div className="alerta erro">{erro}</div>}

        <div className="alternador">
          {['saida', 'entrada'].map((t) => (
            <button type="button" key={t} className={form.tipo === t ? `ativo ${t}` : ''} onClick={() => setForm({ ...form, tipo: t })}>
              {t === 'saida' ? 'Saída' : 'Entrada'}
            </button>
          ))}
        </div>

        <label>
          Descrição
          <input required maxLength={255} value={form.descricao} onChange={mudar('descricao')} />
          {erros.descricao && <small className="erro-campo">{erros.descricao}</small>}
        </label>
        <div className="duas-colunas">
          <label>
            Valor (R$)
            <input required inputMode="decimal" placeholder="0,00" value={form.valor} onChange={mudar('valor')} />
            {erros.valor && <small className="erro-campo">{erros.valor}</small>}
          </label>
          <label>
            Data
            <input type="date" required value={form.data} onChange={mudar('data')} />
            {erros.data && <small className="erro-campo">{erros.data}</small>}
          </label>
        </div>
        <label>
          Categoria
          <select required value={form.categoria_id} onChange={mudar('categoria_id')}>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.descricao}</option>
            ))}
          </select>
          {erros.categoria_id && <small className="erro-campo">{erros.categoria_id}</small>}
        </label>

        <div className="acoes">
          <button type="button" onClick={aoCancelar}>Cancelar</button>
          <button className="primario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}
