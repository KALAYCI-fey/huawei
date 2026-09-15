import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../components/Modal'
import { TraineeBadge } from '../components/Badges'
import { isValidTc, maskTc } from '../format'
import { deleteTrainee, newId, upsertTrainee, useAppState } from '../store'
import type { Trainee, TraineeStatus } from '../types'

export function TraineesPage() {
  const { trainees, programs } = useAppState()
  const [query, setQuery] = useState('')
  const [programId, setProgramId] = useState('all')
  const [editing, setEditing] = useState<Trainee | null>(null)

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    return trainees.filter((item) => {
      const matchesProgram = programId === 'all' || item.programId === programId
      const matchesQuery = `${item.ad} ${item.soyad} ${item.tcKimlikNo} ${item.meslek}`
        .toLowerCase()
        .includes(q)
      return matchesProgram && matchesQuery
    })
  }, [trainees, query, programId])

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Kursiyerler</h1>
          <p className="muted">İşbaşı eğitimine alınan veya alınacak kişiler.</p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() =>
            setEditing({
              id: newId('trn'),
              programId: programs[0]?.id ?? '',
              tcKimlikNo: '',
              ad: '',
              soyad: '',
              dogumTarihi: '',
              telefon: '',
              eposta: '',
              meslek: programs[0]?.meslek ?? '',
              status: 'aday',
            })
          }
        >
          Yeni kursiyer
        </button>
      </div>
      <div className="toolbar">
        <input
          placeholder="Ad, TC veya meslek ara"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={programId} onChange={(event) => setProgramId(event.target.value)}>
          <option value="all">Tüm programlar</option>
          {programs.map((item) => (
            <option key={item.id} value={item.id}>
              {item.ad}
            </option>
          ))}
        </select>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kursiyer</th>
              <th>TC</th>
              <th>Program</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const program = programs.find((row) => row.id === item.programId)
              return (
                <tr key={item.id}>
                  <td>
                    <strong>
                      {item.ad} {item.soyad}
                    </strong>
                    <div className="muted">{item.telefon}</div>
                  </td>
                  <td>{maskTc(item.tcKimlikNo)}</td>
                  <td>{program?.ad ?? '—'}</td>
                  <td>
                    <TraineeBadge status={item.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost" type="button" onClick={() => setEditing(item)}>
                        Düzenle
                      </button>
                      <button
                        className="btn btn-danger"
                        type="button"
                        onClick={() => {
                          if (confirm('Kursiyer silinsin mi?')) deleteTrainee(item.id)
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="empty">Kursiyer bulunamadı.</div> : null}
      </div>
      {editing ? <TraineeForm trainee={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  )
}

function TraineeForm({
  trainee,
  onClose,
}: {
  trainee: Trainee
  onClose: () => void
}) {
  const { programs } = useAppState()
  const [draft, setDraft] = useState(trainee)
  const [error, setError] = useState('')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValidTc(draft.tcKimlikNo)) {
      setError('T.C. kimlik no 11 haneli olmalıdır.')
      return
    }
    upsertTrainee(draft)
    onClose()
  }

  return (
    <Modal title="Kursiyer kaydı" onClose={onClose}>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          <span>Ad</span>
          <input
            required
            value={draft.ad}
            onChange={(event) => setDraft({ ...draft, ad: event.target.value })}
          />
        </label>
        <label>
          <span>Soyad</span>
          <input
            required
            value={draft.soyad}
            onChange={(event) => setDraft({ ...draft, soyad: event.target.value })}
          />
        </label>
        <label>
          <span>T.C. kimlik no</span>
          <input
            required
            inputMode="numeric"
            value={draft.tcKimlikNo}
            onChange={(event) => setDraft({ ...draft, tcKimlikNo: event.target.value })}
          />
        </label>
        <label>
          <span>Doğum tarihi</span>
          <input
            type="date"
            value={draft.dogumTarihi}
            onChange={(event) => setDraft({ ...draft, dogumTarihi: event.target.value })}
          />
        </label>
        <label>
          <span>Telefon</span>
          <input
            value={draft.telefon}
            onChange={(event) => setDraft({ ...draft, telefon: event.target.value })}
          />
        </label>
        <label>
          <span>E-posta</span>
          <input
            value={draft.eposta}
            onChange={(event) => setDraft({ ...draft, eposta: event.target.value })}
          />
        </label>
        <label className="full">
          <span>Program</span>
          <select
            required
            value={draft.programId}
            onChange={(event) => {
              const program = programs.find((item) => item.id === event.target.value)
              setDraft({
                ...draft,
                programId: event.target.value,
                meslek: program?.meslek ?? draft.meslek,
              })
            }}
          >
            <option value="">Seçin</option>
            {programs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ad}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Meslek</span>
          <input
            value={draft.meslek}
            onChange={(event) => setDraft({ ...draft, meslek: event.target.value })}
          />
        </label>
        <label>
          <span>Durum</span>
          <select
            value={draft.status}
            onChange={(event) =>
              setDraft({ ...draft, status: event.target.value as TraineeStatus })
            }
          >
            <option value="aday">Aday</option>
            <option value="onaylandi">Onaylandı</option>
            <option value="isbasi">İşbaşı yapıldı</option>
            <option value="devam">Eğitimde</option>
            <option value="tamamlandi">Tamamlandı</option>
            <option value="ayrildi">Ayrıldı</option>
          </select>
        </label>
        {error ? <p className="error full">{error}</p> : null}
        <div className="full row-actions">
          <button className="btn btn-primary" type="submit">
            Kaydet
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Vazgeç
          </button>
        </div>
      </form>
    </Modal>
  )
}
