import { useRef, useState } from 'react'
import type { DocumentKind, Program, UploadedDoc } from '../types'

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/tiff', 'image/tif']

export const DOCUMENT_ROWS: {
  no: number
  tur: DocumentKind
  ad: string
  bilgi: string
  sablon?: boolean
}[] = [
  {
    no: 1,
    tur: 'talep_dilekcesi',
    ad: 'Talep Dilekçesi',
    bilgi:
      'İlgili şablon dosyasını indirip ilgili alanları doldurduktan ve imzaladıktan sonra belgeyi sisteme yüklemeniz gerekmektedir.',
    sablon: true,
  },
  {
    no: 2,
    tur: 'isveren_belgesi',
    ad: 'İşveren Belgesi',
    bilgi:
      'İşveren türüne göre; ticaret sicil gazetesi, vakıf senedi, dernek tüzüğü, merkezin bulunduğu ile ait birlik veya oda kaydı belgelerinin noter onaylı örneği ya da işverenin hukuki durumunu gösterir belgenin yüklenmesi gerekmektedir.',
  },
  {
    no: 3,
    tur: 'imza_yetki',
    ad: 'İmza Yetki Belgesi',
    bilgi:
      'İşverenin veya onun yerine yetkili kişinin imzaya yetkili olduğuna dair belgenin yüklenmesi gerekmektedir.',
  },
  {
    no: 4,
    tur: 'ortaklik',
    ad: 'Ortaklık Belgesi',
    bilgi: 'Ortaklık Belgesi',
  },
  {
    no: 5,
    tur: 'sigortali_belge',
    ad: 'Aynı veya Yakın Meslekte Çalışan Sigortalıya İlişkin Belge',
    bilgi: 'Aynı veya Yakın Meslekte Çalışan Sigortalıya İlişkin Belge',
  },
  {
    no: 6,
    tur: 'tehlikeli_egitim',
    ad: 'Tehlikeli/Çok Tehlikeli Mesleğe İlişkin Eğitim Modülü/Programı',
    bilgi: 'Tehlikeli/Çok Tehlikeli Mesleğe İlişkin Eğitim Modülü/Programı',
  },
  {
    no: 7,
    tur: 'diger',
    ad: 'Diğer Belgeler',
    bilgi: 'Katılımcıya ilişkin belgeler, işyeri statüsünü gösterir belgeler, vb.',
  },
]

export function DocumentPanel({
  program,
  onChange,
  onNext,
}: {
  program: Program
  onChange: (belgeler: UploadedDoc[]) => void
  onNext: () => void
}) {
  const [error, setError] = useState('')
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  async function handleFile(tur: DocumentKind, file: File | undefined) {
    if (!file) return
    const type = file.type || guessType(file.name)
    if (!ALLOWED.includes(type) && !/\.(pdf|jpe?g|tiff?)$/i.test(file.name)) {
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
    setError('')
  }

  function downloadTemplate() {
    const content = `TALEP DİLEKÇESİ (ŞABLON)

İşveren unvanı:
Vergi no:
İŞKUR İl Müdürlüğü'ne

İşbaşı Eğitim Programı (İEP) kapsamında başvuru yapılması hususunda gereğini arz ederim.

Tarih:
İmza:
`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'talep-dilekcesi-sablon.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <p className="notice">
        Belgeler PDF, JPEG veya TIFF olmalıdır. Şablon doldurulup imzalandıktan sonra yüklenir.
      </p>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Belge Adı</th>
              <th>Bilgi</th>
              <th>Belge</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {DOCUMENT_ROWS.map((row) => {
              const uploaded = program.belgeler.find((item) => item.tur === row.tur)
              return (
                <tr key={row.tur}>
                  <td>{row.no}</td>
                  <td>{row.ad}</td>
                  <td className="doc-info">{row.bilgi}</td>
                  <td>
                    {uploaded ? (
                      <a className="btn-doc" href={uploaded.dataUrl} target="_blank" rel="noreferrer">
                        Belge Göster
                      </a>
                    ) : (
                      <button className="btn-doc" type="button" disabled>
                        Belge Göster
                      </button>
                    )}
                  </td>
                  <td>{uploaded ? 'Yüklendi' : 'Yeni'}</td>
                  <td>
                    <div className="doc-actions">
                      <input
                        ref={(node) => {
                          inputs.current[row.tur] = node
                        }}
                        type="file"
                        hidden
                        accept=".pdf,.jpg,.jpeg,.tif,.tiff,application/pdf,image/jpeg,image/tiff"
                        onChange={(event) => {
                          void handleFile(row.tur, event.target.files?.[0])
                          event.target.value = ''
                        }}
                      />
                      <button
                        className="btn-doc"
                        type="button"
                        onClick={() => inputs.current[row.tur]?.click()}
                      >
                        Belge Yükle
                      </button>
                      <button
                        className="btn-sil"
                        type="button"
                        disabled={!uploaded}
                        onClick={() => onChange(program.belgeler.filter((item) => item.tur !== row.tur))}
                      >
                        Sil
                      </button>
                      {row.sablon ? (
                        <button className="btn-sablon" type="button" onClick={downloadTemplate}>
                          Şablon indir
                        </button>
                      ) : (
                        <span className="muted">--</span>
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
