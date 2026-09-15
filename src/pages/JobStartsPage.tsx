import { useMemo, useState, type FormEvent } from 'react'
import { BildirimBadge } from '../components/Badges'
import { Modal } from '../components/Modal'
import { formatDate, maskTc } from '../format'
import { deleteJobStart, newId, upsertJobStart, useAppState } from '../store'
import type { IskurBildirimDurumu, JobStart } from '../types'

export function JobStartsPage() {
  const { jobStarts, trainees, programs } = useAppState()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<JobStart | null>(null)

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    return jobStarts.filter((item) => {
      const trainee = trainees.find((row) => row.id === item.traineeId)
      const program = programs.find((row) => row.id === item.programId)
      return `${trainee?.ad} ${trainee?.soyad} ${program?.ad} ${item.calismaYeri}`
        .toLowerCase()
        .includes(q)
    })
  }, [jobStarts, trainees, programs, query])

  const pending = trainees.filter(
    (item) => !jobStarts.some((start) => start.traineeId === item.id) && item.status !== 'ayrildi',
  )

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>İşbaşı bildirimleri</h1>
          <p className="muted">
            Kursiyerin fiili işbaşı tarihini, görevini ve belge kontrolünü kaydedin.
          </p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() =>
            setEditing({
              id: newId('js'),
              traineeId: pending[0]?.id ?? trainees[0]?.id ?? '',
              programId: pending[0]?.programId ?? programs[0]?.id ?? '',
              isbasiTarihi: new Date().toISOString().slice(0, 10),
              unvanGorev: pending[0]?.meslek ?? '',
              calismaYeri: '',
              vardiya: '08:00 – 17:00',
              sgkBildirimi: false,
              iskurBildirimDurumu: 'bekliyor',
              sozlesme: false,
              kimlikFotokopi: false,
              sgkIseGiris: false,
              notlar: '',
              createdAt: new Date().toISOString(),
            })
          }
        >
          İşbaşı kaydı aç
        </button>
      </div>

      {pending.length > 0 ? (
        <p className="notice" style={{ marginBottom: 16 }}>
          İşbaşı bekleyen kursiyer: {pending.map((item) => `${item.ad} ${item.soyad}`).join(', ')}
        </p>
      ) : null}

      <div className="toolbar">
        <input
          placeholder="Kursiyer, program veya çalışma yeri ara"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kursiyer</th>
              <th>İşbaşı tarihi</th>
              <th>Görev / yer</th>
              <th>Belgeler</th>
              <th>İŞKUR</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const trainee = trainees.find((row) => row.id === item.traineeId)
              const docs = [item.sozlesme, item.kimlikFotokopi, item.sgkIseGiris, item.sgkBildirimi]
              const done = docs.filter(Boolean).length
              return (
                <tr key={item.id}>
                  <td>
                    <strong>
                      {trainee ? `${trainee.ad} ${trainee.soyad}` : '—'}
                    </strong>
                    <div className="muted">{trainee ? maskTc(trainee.tcKimlikNo) : ''}</div>
                  </td>
                  <td>{formatDate(item.isbasiTarihi)}</td>
                  <td>
                    {item.unvanGorev}
                    <div className="muted">
                      {item.calismaYeri} · {item.vardiya}
                    </div>
                  </td>
                  <td>
                    {done}/4
                    {done < 4 ? <div className="muted">Eksik belge var</div> : <div className="muted">Tamam</div>}
                  </td>
                  <td>
                    <BildirimBadge status={item.iskurBildirimDurumu} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost" type="button" onClick={() => setEditing(item)}>
                        Güncelle
                      </button>
                      <button
                        className="btn btn-danger"
                        type="button"
                        onClick={() => {
                          if (confirm('İşbaşı kaydı silinsin mi?')) deleteJobStart(item.id)
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
        {rows.length === 0 ? <div className="empty">İşbaşı kaydı yok.</div> : null}
      </div>
      {editing ? <JobStartForm jobStart={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  )
}

function JobStartForm({
  jobStart,
  onClose,
}: {
  jobStart: JobStart
  onClose: () => void
}) {
  const { trainees, programs } = useAppState()
  const [draft, setDraft] = useState(jobStart)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    upsertJobStart(draft)
    onClose()
  }

  const selectedTrainee = trainees.find((item) => item.id === draft.traineeId)

  return (
    <Modal title="İşbaşı kaydı" onClose={onClose}>
      <form className="form-grid" onSubmit={onSubmit}>
        <label className="full">
          <span>Kursiyer</span>
          <select
            required
            value={draft.traineeId}
            onChange={(event) => {
              const trainee = trainees.find((item) => item.id === event.target.value)
              setDraft({
                ...draft,
                traineeId: event.target.value,
                programId: trainee?.programId ?? draft.programId,
                unvanGorev: trainee?.meslek || draft.unvanGorev,
              })
            }}
          >
            <option value="">Seçin</option>
            {trainees.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ad} {item.soyad} — {maskTc(item.tcKimlikNo)}
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          <span>Program</span>
          <select
            required
            value={draft.programId}
            onChange={(event) => setDraft({ ...draft, programId: event.target.value })}
          >
            {programs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ad}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>İşbaşı tarihi</span>
          <input
            type="date"
            required
            value={draft.isbasiTarihi}
            onChange={(event) => setDraft({ ...draft, isbasiTarihi: event.target.value })}
          />
        </label>
        <label>
          <span>Görev / unvan</span>
          <input
            required
            value={draft.unvanGorev}
            onChange={(event) => setDraft({ ...draft, unvanGorev: event.target.value })}
          />
        </label>
        <label>
          <span>Çalışma yeri</span>
          <input
            required
            value={draft.calismaYeri}
            onChange={(event) => setDraft({ ...draft, calismaYeri: event.target.value })}
          />
        </label>
        <label>
          <span>Vardiya</span>
          <input
            value={draft.vardiya}
            onChange={(event) => setDraft({ ...draft, vardiya: event.target.value })}
          />
        </label>
        <label>
          <span>İŞKUR bildirim durumu</span>
          <select
            value={draft.iskurBildirimDurumu}
            onChange={(event) =>
              setDraft({
                ...draft,
                iskurBildirimDurumu: event.target.value as IskurBildirimDurumu,
              })
            }
          >
            <option value="bekliyor">Hazırlık bekliyor</option>
            <option value="hazir">e-Şube için hazır</option>
            <option value="e_sube_isaretlendi">e-Şube işaretlendi</option>
            <option value="onaylandi">İŞKUR onaylı</option>
          </select>
        </label>
        <div className="full checks">
          <label>
            <input
              type="checkbox"
              checked={draft.sozlesme}
              onChange={(event) => setDraft({ ...draft, sozlesme: event.target.checked })}
            />
            İşbaşı eğitim sözleşmesi
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.kimlikFotokopi}
              onChange={(event) => setDraft({ ...draft, kimlikFotokopi: event.target.checked })}
            />
            Kimlik fotokopisi
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.sgkIseGiris}
              onChange={(event) => setDraft({ ...draft, sgkIseGiris: event.target.checked })}
            />
            SGK işe giriş belgesi
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.sgkBildirimi}
              onChange={(event) => setDraft({ ...draft, sgkBildirimi: event.target.checked })}
            />
            SGK bildirimi yapıldı
          </label>
        </div>
        <label className="full">
          <span>Notlar</span>
          <textarea
            rows={3}
            value={draft.notlar}
            onChange={(event) => setDraft({ ...draft, notlar: event.target.value })}
          />
        </label>
        {selectedTrainee ? (
          <p className="notice full">
            Resmi bildirim bu uygulamadan gönderilmez. {selectedTrainee.ad} {selectedTrainee.soyad}{' '}
            için e-Şube adımını ayrı tamamlayın.
          </p>
        ) : null}
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
