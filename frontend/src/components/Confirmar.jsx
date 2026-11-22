import { useEffect, useRef } from 'react'

// Substitui o window.confirm(): é estilizável, funciona em qualquer navegador e se fecha com Esc.
export default function Confirmar({ titulo, texto, rotuloConfirmar, perigo = false, enviando = false, aoConfirmar, aoCancelar }) {
  const cancelar = useRef(null)

  useEffect(() => {
    cancelar.current?.focus()
    const aoTeclar = (e) => e.key === 'Escape' && aoCancelar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aoCancelar])

  return (
    <div className="fundo-modal" onMouseDown={(e) => e.target === e.currentTarget && aoCancelar()}>
      <div className="cartao modal" role="alertdialog" aria-modal="true" aria-labelledby="confirmar-titulo" aria-describedby="confirmar-texto">
        <h2 id="confirmar-titulo">{titulo}</h2>
        <p id="confirmar-texto" className="descricao">{texto}</p>
        <div className="acoes">
          <button type="button" ref={cancelar} onClick={aoCancelar}>Cancelar</button>
          <button type="button" className={perigo ? 'perigo-solido' : 'primario'} disabled={enviando} onClick={aoConfirmar}>
            {enviando ? 'Aguarde…' : rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
