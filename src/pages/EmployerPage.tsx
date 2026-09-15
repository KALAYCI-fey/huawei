import { useState, type FormEvent } from 'react'
import { resetDemoData, updateEmployer, useAppState } from '../store'

export function EmployerPage() {
  const { employer } = useAppState()
  const [draft, setDraft] = useState(employer)
  const [saved, setSaved] = useState(false)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    updateEmployer(draft)
    setSaved(true)
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>İşveren bilgileri</h1>
          <p className="muted">İEP dosyasında kullanılacak işyeri kimliği.</p>
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            if (confirm('Örnek veriler yüklensin mi? Mevcut kayıtlar silinir.')) {
              resetDemoData()
              window.location.reload()
            }
          }}
        >
          Demo veriyi sıfırla
        </button>
      </div>
      <form className="card form-grid" onSubmit={onSubmit}>
        <label className="full">
          <span>Unvan</span>
          <input
            required
            value={draft.unvan}
            onChange={(event) => setDraft({ ...draft, unvan: event.target.value })}
          />
        </label>
        <label>
          <span>Vergi no</span>
          <input
            value={draft.vergiNo}
            onChange={(event) => setDraft({ ...draft, vergiNo: event.target.value })}
          />
        </label>
        <label>
          <span>SGK sicil no</span>
          <input
            value={draft.sgkSicilNo}
            onChange={(event) => setDraft({ ...draft, sgkSicilNo: event.target.value })}
          />
        </label>
        <label>
          <span>İl</span>
          <input
            value={draft.il}
            onChange={(event) => setDraft({ ...draft, il: event.target.value })}
          />
        </label>
        <label>
          <span>İlçe</span>
          <input
            value={draft.ilce}
            onChange={(event) => setDraft({ ...draft, ilce: event.target.value })}
          />
        </label>
        <label className="full">
          <span>Adres</span>
          <input
            value={draft.adres}
            onChange={(event) => setDraft({ ...draft, adres: event.target.value })}
          />
        </label>
        <label>
          <span>Yetkili</span>
          <input
            value={draft.yetkili}
            onChange={(event) => setDraft({ ...draft, yetkili: event.target.value })}
          />
        </label>
        <label>
          <span>Telefon</span>
          <input
            value={draft.telefon}
            onChange={(event) => setDraft({ ...draft, telefon: event.target.value })}
          />
        </label>
        <label className="full">
          <span>E-posta</span>
          <input
            value={draft.eposta}
            onChange={(event) => setDraft({ ...draft, eposta: event.target.value })}
          />
        </label>
        <div className="full row-actions">
          <button className="btn btn-primary" type="submit">
            Kaydet
          </button>
          {saved ? <span className="muted">Kaydedildi.</span> : null}
        </div>
      </form>
    </div>
  )
}
