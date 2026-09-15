import { useMemo, useState, type FormEvent } from 'react'
import { IepBilgilerForm } from '../components/IepBilgilerForm'
import { ProgramBadge } from '../components/Badges'
import { formatDate } from '../format'
import {
  deleteProgram,
  getSelectedFirmaId,
  newId,
  setSelectedFirmaId,
  upsertProgram,
  useAppState,
} from '../store'
import type {
  DocumentKind,
  Program,
  UploadedDoc,
  Workplace,
} from '../types'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/tiff', 'image/tif']

const DOCUMENT_ROWS: { tur: DocumentKind; ad: string; zorunlu: boolean }[] = [
  { tur: 'talep_dilekcesi', ad: 'Talep dilekçesi', zorunlu: true },
  { tur: 'isveren_belgesi', ad: 'İşveren belgesi', zorunlu: true },
  { tur: 'imza_yetki', ad: 'İmza yetki belgesi', zorunlu: true },
  { tur: 'ortaklik', ad: 'Ortaklık belgesi', zorunlu: false },
]

function emptyWeek() {
  return [true, true, true, true, true, false, false]
}

function emptyProgram(firma: Workplace | undefined): Program {
  return {
    id: newId('prg'),
    firmaId: firma?.id ?? '',
    ad: '',
    iskurDosyaNo: `IEP-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`,
    kursNo: '',
    meslek: '',
    meslekKodu: '',
    kontenjan: 4,
    baslangic: '',
    bitis: '',
    gunlukSaat: 8,
    toplamGun: 0,
    status: 'taslak',
    aciklama: '',
    kontenjanIl: firma?.il ?? '',
    kontenjanIlce: firma?.ilce ?? '',
    uygulamaIl: firma?.il ?? '',
    uygulamaIlce: firma?.ilce ?? '',
    uygulamaAdres: firma?.adres ?? '',
    ogrenimAlt: 'İlköğretim',
    ogrenimUst: 'Lisans',
    yasMin: 18,
    yasMax: 50,
    kursDurum: '',
    basvuruTarih: '',
    tatilGunleri: [],
    fiiliDortteBirlikTarih: '',
    iepKesSayisi: 0,
    kontenjanSayisi: 0,
    kontenjanKullanilan: 0,
    ayniMeslekteSigortali: '',
    imalatBilisim: '',
    tehlikeliMeslek: '',
    programIlani: '',
    erkekKursiyer: 0,
    kadinKursiyer: 0,
    calisanSayisi: 0,
    kalanKontenjan: 0,
    ilkHafta: emptyWeek(),
    devamHafta: emptyWeek(),
    sonHafta: emptyWeek(),
    belgeler: [],
  }
}

export function ProgramsPage() {
  const { programs, workplaces } = useAppState()
  const [firmaId, setFirmaId] = useState(getSelectedFirmaId() || workplaces[0]?.id || '')
  const [selectedId, setSelectedId] = useState(() => {
    const selectedFirma = getSelectedFirmaId() || workplaces[0]?.id || ''
    return programs.find((item) => item.firmaId === selectedFirma)?.id || programs[0]?.id || ''
  })
  const [tab, setTab] = useState<'bilgiler' | 'belgeler' | 'katilimci'>('bilgiler')

  const firma = workplaces.find((item) => item.id === firmaId)
  const filtered = programs.filter((item) => !firmaId || item.firmaId === firmaId)
  const selected = programs.find((item) => item.id === selectedId) ?? null

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>İEP başvuru işlemleri</h1>
          <p className="muted">
            Firma seçildikten sonra yeşil alanlar doldurulur. Sonraki sekmede belgeler yüklenir.
          </p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            const created = emptyProgram(firma)
            upsertProgram(created)
            setSelectedId(created.id)
            setTab('bilgiler')
          }}
        >
          Başvuru oluştur
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label>
          <span>Firma / işyeri</span>
          <select
            value={firmaId}
            onChange={(event) => {
              setFirmaId(event.target.value)
              setSelectedFirmaId(event.target.value)
              const next = programs.find((item) => item.firmaId === event.target.value)
              setSelectedId(next?.id ?? '')
            }}
          >
            {workplaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.unvan}
              </option>
            ))}
          </select>
        </label>
        {firma ? (
          <p className="muted" style={{ marginTop: 8 }}>
            {firma.il} / {firma.ilce} · SGK {firma.sgkSicilNo} · {firma.adres}
          </p>
        ) : null}
      </div>

      <div className="split">
        <div className="card table-wrap">
          <h2 className="section-title">Başvuru listesi</h2>
          <table>
            <thead>
              <tr>
                <th>Başvuru no</th>
                <th>Meslek</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className={item.id === selectedId ? 'row-selected' : undefined}
                  onClick={() => {
                    setSelectedId(item.id)
                    setTab('bilgiler')
                  }}
                >
                  <td>{item.iskurDosyaNo}</td>
                  <td>{item.meslek || item.ad || 'Taslak'}</td>
                  <td>
                    <ProgramBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? <div className="empty">Bu firmada başvuru yok.</div> : null}
        </div>

        <div>
          {selected ? (
            <ApplicationEditor
              key={selected.id}
              program={selected}
              tab={tab}
              onTab={setTab}
              onDelete={() => {
                if (confirm('Başvuru silinsin mi?')) {
                  deleteProgram(selected.id)
                  setSelectedId('')
                }
              }}
            />
          ) : (
            <div className="card empty">Firma seçip bir başvuru oluşturun veya listeden seçin.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ApplicationEditor({
  program,
  tab,
  onTab,
  onDelete,
}: {
  program: Program
  tab: 'bilgiler' | 'belgeler' | 'katilimci'
  onTab: (tab: 'bilgiler' | 'belgeler' | 'katilimci') => void
  onDelete: () => void
}) {
  const { trainees, workplaces } = useAppState()
  const [draft, setDraft] = useState(program)
  const participants = trainees.filter((item) => item.programId === program.id)
  const firma = workplaces.find((item) => item.id === draft.firmaId)
  const fiiliGun = useMemo(() => countWorkDays(draft), [draft])

  function save(event?: FormEvent) {
    event?.preventDefault()
    upsertProgram({
      ...draft,
      ad: draft.ad || `${draft.meslek} İşbaşı Eğitim Programı`,
      kontenjan: draft.erkekKursiyer + draft.kadinKursiyer || draft.kontenjan,
      toplamGun: fiiliGun,
    })
  }

  return (
    <div className="card">
      <div className="tabs">
        <button className={tab === 'bilgiler' ? 'active' : ''} type="button" onClick={() => onTab('bilgiler')}>
          Başvuru bilgileri
        </button>
        <button className={tab === 'belgeler' ? 'active' : ''} type="button" onClick={() => onTab('belgeler')}>
          Belgeler
        </button>
        <button className={tab === 'katilimci' ? 'active' : ''} type="button" onClick={() => onTab('katilimci')}>
          Katılımcılar
        </button>
      </div>

      {tab === 'bilgiler' ? (
        <form onSubmit={save}>
          <IepBilgilerForm draft={draft} setDraft={setDraft} fiiliGun={fiiliGun} />
          <div className="row-actions" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" type="submit">
              Kaydet
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => onTab('belgeler')}>
              Sonraki sekme
            </button>
            <button className="btn btn-danger" type="button" onClick={onDelete}>
              Sil
            </button>
          </div>
          {firma ? (
            <p className="notice" style={{ marginTop: 12 }}>
              Seçilen firma: {firma.unvan}. Yeşil alanlar doldurulur; gri alanlar sistem tarafından gelir.
            </p>
          ) : null}
        </form>
      ) : null}

      {tab === 'belgeler' ? (
        <DocumentPanel
          program={draft}
          onChange={(belgeler) => {
            const next = { ...draft, belgeler }
            setDraft(next)
            upsertProgram(next)
          }}
          onNext={() => onTab('katilimci')}
        />
      ) : null}

      {tab === 'katilimci' ? (
        <div>
          <p className="muted">Bu başvuruya bağlı kursiyerler.</p>
          <table>
            <thead>
              <tr>
                <th>Ad soyad</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.ad} {item.soyad}
                  </td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {participants.length === 0 ? <div className="empty">Henüz katılımcı yok. Kursiyerler ekranından ekleyin.</div> : null}
        </div>
      ) : null}
    </div>
  )
}

function DocumentPanel({
  program,
  onChange,
  onNext,
}: {
  program: Program
  onChange: (belgeler: UploadedDoc[]) => void
  onNext: () => void
}) {
  const [pending, setPending] = useState<Record<string, File | null>>({})
  const [error, setError] = useState('')

  async function upload(tur: DocumentKind) {
    const file = pending[tur]
    if (!file) {
      setError('Önce dosya seçin.')
      return
    }
    const type = file.type || guessType(file.name)
    if (!ALLOWED_TYPES.includes(type) && !/\.(pdf|jpe?g|tiff?)$/i.test(file.name)) {
      setError('Yalnızca PDF, JPEG veya TIFF yüklenebilir.')
      return
    }
    const dataUrl = await readFile(file)
    const doc: UploadedDoc = {
      tur,
      fileName: file.name,
      fileType: type || file.type,
      dataUrl,
      uploadedAt: new Date().toISOString(),
    }
    onChange([...program.belgeler.filter((item) => item.tur !== tur), doc])
    setPending((current) => ({ ...current, [tur]: null }))
    setError('')
  }

  return (
    <div>
      <p className="notice">
        Belgeler PDF, JPEG veya TIFF olmalıdır. Şablon doldurulup tarandıktan sonra yüklenir.
      </p>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Belge</th>
              <th>Zorunlu</th>
              <th>Dosya</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {DOCUMENT_ROWS.map((row) => {
              const uploaded = program.belgeler.find((item) => item.tur === row.tur)
              return (
                <tr key={row.tur}>
                  <td>{row.ad}</td>
                  <td>{row.zorunlu ? 'Evet' : 'Hayır'}</td>
                  <td>
                    {uploaded ? (
                      <div>
                        {uploaded.fileName}
                        <div className="muted">{formatDate(uploaded.uploadedAt.slice(0, 10))}</div>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.tif,.tiff,application/pdf,image/jpeg,image/tiff"
                        onChange={(event) =>
                          setPending((current) => ({
                            ...current,
                            [row.tur]: event.target.files?.[0] ?? null,
                          }))
                        }
                      />
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      {!uploaded ? (
                        <button className="btn btn-primary" type="button" onClick={() => void upload(row.tur)}>
                          Yükle
                        </button>
                      ) : (
                        <>
                          <a className="btn btn-ghost" href={uploaded.dataUrl} target="_blank" rel="noreferrer">
                            Görüntüle
                          </a>
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => onChange(program.belgeler.filter((item) => item.tur !== row.tur))}
                          >
                            Sil
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="row-actions" style={{ marginTop: 12 }}>
        <button className="btn btn-ghost" type="button" onClick={onNext}>
          Sonraki sekme
        </button>
      </div>
    </div>
  )
}

function guessType(name: string) {
  if (name.toLowerCase().endsWith('.pdf')) return 'application/pdf'
  if (/\.jpe?g$/i.test(name)) return 'image/jpeg'
  if (/\.tiff?$/i.test(name)) return 'image/tiff'
  return ''
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function countWorkDays(program: Program) {
  if (!program.baslangic || !program.bitis) return 0
  const start = new Date(`${program.baslangic}T00:00:00`)
  const end = new Date(`${program.bitis}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0
  let count = 0
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const jsDay = date.getDay()
    const index = jsDay === 0 ? 6 : jsDay - 1
    const isFirstWeek = date.getTime() - start.getTime() < 7 * 86400000
    const isLastWeek = end.getTime() - date.getTime() < 7 * 86400000
    const flags = isFirstWeek ? program.ilkHafta : isLastWeek ? program.sonHafta : program.devamHafta
    const iso = date.toISOString().slice(0, 10)
    if (program.tatilGunleri?.includes(iso)) continue
    if (flags[index]) count += 1
  }
  return count
}
