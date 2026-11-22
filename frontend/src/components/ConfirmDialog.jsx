import { useEffect, useRef } from 'react'

// Replaces window.confirm(): it can be styled, works in every browser and closes with Esc.
export default function ConfirmDialog({ title, text, confirmLabel, danger = false, busy = false, onConfirm, onCancel }) {
  const cancelButton = useRef(null)

  useEffect(() => {
    cancelButton.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="card modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-text">
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-text" className="description">{text}</p>
        <div className="actions">
          <button type="button" ref={cancelButton} onClick={onCancel}>Cancel</button>
          <button type="button" className={danger ? 'danger-solid' : 'primary'} disabled={busy} onClick={onConfirm}>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
