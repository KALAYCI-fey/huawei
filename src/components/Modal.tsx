import type { ReactNode } from 'react'

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <strong>{title}</strong>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Kapat
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
