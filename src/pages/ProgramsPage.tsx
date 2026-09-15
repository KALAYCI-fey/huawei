import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../components/Modal'
import { ProgramBadge } from '../components/Badges'
import { formatDate } from '../format'
import { deleteProgram, newId, upsertProgram, useAppState } from '../store'
import type { Program, ProgramStatus } from '../types'

const emptyProgram: Omit<Program, 'id'> = {
  ad: '',
  iskurDosyaNo: '',
  meslek: '',
  meslekKodu: '',
  kontenjan: 4,
  baslangic: '',
  bitis: '',
  gunlukSaat: 8,
  toplamGun: 60,
  status: 'taslak',
  aciklama: '',
}

export function ProgramsPage() {
  const { programs, trainees } = useAppState()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Program | null>(null)

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    return programs.filter((item) =>
      `${item.ad} ${item.iskurDosyaNo} ${item.meslek}`.toLowerCase().includes(q),
    )
  }, [programs, query])

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Programlar</h1>
          <p className="muted">İŞKUR işbaşı eğitim programı (İEP) dosyaları.</p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setEditing({ ...emptyProgram, id: newId('prg') })}
        >
          Yeni program
        </button>
      </div>
      <div className="toolbar">
        <input
          placeholder="Program, meslek veya dosya no ara"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Program</th>
              <th>Dosya no</th>
              <th>Kontenjan</th>
              <th>Tarih</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const count = trainees.filter((row) => row.programId === item.id).length
              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.ad}</strong>
                    <div className="muted">
                      {item.meslek} · {item.meslekKodu}
                    </div>
                  </td>
                  <td>{item.iskurDosyaNo || '—'}</td>
                  <td>
                    {count}/{item.kontenjan}
                  </td>
                  <td>
                    {formatDate(item.baslangic)} – {formatDate(item.bitis)}
                  </td>
                  <td>
                    <ProgramBadge status={item.status} />
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
                          if (confirm('Program ve bağlı kursiyer kayıtları silinsin mi?')) {
                            deleteProgram(item.id)
                          }
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
        {rows.length === 0 ? <div className="empty">Program bulunamadı.</div> : null}
      </div>
      {editing ? (
        <ProgramForm
          program={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}

function ProgramForm({
  program,
  onClose,
}: {
  program: Program
  onClose: () => void
}) {
  const [draft, setDraft] = useState(program)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    upsertProgram(draft)
    onClose()
  }

  return (
    <Modal title="Program kaydı" onClose={onClose}>
      <form className="form-grid" onSubmit={onSubmit}>
        <label className="full">
          <span>Program adı</span>
          <input
            required
            value={draft.ad}
            onChange={(event) => setDraft({ ...draft, ad: event.target.value })}
          />
        </label>
        <label>
          <span>İŞKUR dosya no</span>
          <input
            value={draft.iskurDosyaNo}
            onChange={(event) => setDraft({ ...draft, iskurDosyaNo: event.target.value })}
          />
        </label>
        <label>
          <span>Durum</span>
          <select
            value={draft.status}
            onChange={(event) =>
              setDraft({ ...draft, status: event.target.value as ProgramStatus })
            }
          >
            <option value="taslak">Taslak</option>
            <option value="basvuru">Başvuru</option>
            <option value="onaylandi">Onaylandı</option>
            <option value="devam">Devam ediyor</option>
            <option value="tamamlandi">Tamamlandı</option>
            <option value="iptal">İptal</option>
          </select>
        </label>
        <label>
          <span>Meslek</span>
          <input
            required
            value={draft.meslek}
            onChange={(event) => setDraft({ ...draft, meslek: event.target.value })}
          />
        </label>
        <label>
          <span>Meslek kodu</span>
          <input
            value={draft.meslekKodu}
            onChange={(event) => setDraft({ ...draft, meslekKodu: event.target.value })}
          />
        </label>
        <label>
          <span>Kontenjan</span>
          <input
            type="number"
            min={1}
            value={draft.kontenjan}
            onChange={(event) => setDraft({ ...draft, kontenjan: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>Günlük saat</span>
          <input
            type="number"
            min={1}
            value={draft.gunlukSaat}
            onChange={(event) => setDraft({ ...draft, gunlukSaat: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>Başlangıç</span>
          <input
            type="date"
            value={draft.baslangic}
            onChange={(event) => setDraft({ ...draft, baslangic: event.target.value })}
          />
        </label>
        <label>
          <span>Bitiş</span>
          <input
            type="date"
            value={draft.bitis}
            onChange={(event) => setDraft({ ...draft, bitis: event.target.value })}
          />
        </label>
        <label className="full">
          <span>Açıklama</span>
          <textarea
            rows={3}
            value={draft.aciklama}
            onChange={(event) => setDraft({ ...draft, aciklama: event.target.value })}
          />
        </label>
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
