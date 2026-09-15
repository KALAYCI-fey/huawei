import { useState } from 'react'
import type { DocumentKind, Program, UploadedDoc } from '../types'

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.tif,.tiff,.doc,.docx,application/pdf,image/jpeg,image/png,image/tiff,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function isAllowed(file: File) {
  return /\.(pdf|jpe?g|png|tiff?|docx?)$/i.test(file.name)
}

const DOCUMENT_ROWS: {
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
  const [preview, setPreview] = useState<UploadedDoc | null>(null)

  async function handleFile(tur: DocumentKind, file: File | undefined) {
    if (!file) return
    if (!isAllowed(file)) {
      setError('PDF, Word (doc/docx), JPEG, PNG veya TIFF yükleyin.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Dosya 8 MB sınırını aşıyor.')
      return
    }
    try {
      const dataUrl = await readFile(file)
      const doc: UploadedDoc = {
        tur,
        fileName: file.name,
        fileType: file.type || guessType(file.name),
        dataUrl,
        uploadedAt: new Date().toISOString(),
      }
      onChange([...program.belgeler.filter((item) => item.tur !== tur), doc])
      setError('')
    } catch {
      setError('Dosya okunamadı. Tekrar deneyin.')
    }
  }

  return (
    <div>
      <p className="notice">
        PDF, Word, JPEG, PNG veya TIFF yükleyebilirsiniz. Talep dilekçesi şablonunu indirip doldurduktan sonra
        buradan tekrar yükleyin.
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
                    {uploaded?.dataUrl ? (
                      <button
                        className="btn-doc"
                        type="button"
                        onClick={() => setPreview(uploaded)}
                      >
                        Belge Göster
                      </button>
                    ) : (
                      <button className="btn-doc" type="button" disabled>
                        Belge Göster
                      </button>
                    )}
                  </td>
                  <td>
                    {uploaded ? (
                      <>
                        Yüklendi
                        <div className="muted">{uploaded.fileName}</div>
                      </>
                    ) : (
                      'Yeni'
                    )}
                  </td>
                  <td>
                    <div className="doc-actions">
                      <label className="btn-doc file-btn">
                        Belge Yükle
                        <input
                          type="file"
                          accept={ACCEPT}
                          onChange={(event) => {
                            void handleFile(row.tur, event.target.files?.[0])
                            event.target.value = ''
                          }}
                        />
                      </label>
                      <button
                        className="btn-sil"
                        type="button"
                        disabled={!uploaded}
                        onClick={() => onChange(program.belgeler.filter((item) => item.tur !== row.tur))}
                      >
                        Sil
                      </button>
                      {row.sablon ? (
                        <a
                          className="btn-sablon"
                          href="/sablonlar/talep-dilekcesi.docx"
                          download="Talep_Dilekcesi.docx"
                        >
                          Şablon indir
                        </a>
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
      {preview ? <DocumentPreview doc={preview} onClose={() => setPreview(null)} /> : null}
    </div>
  )
}

function DocumentPreview({
  doc,
  onClose,
}: {
  doc: UploadedDoc
  onClose: () => void
}) {
  const kind = previewKind(doc)
  return (
    <div className="preview-backdrop" onClick={onClose}>
      <div className="preview-modal" onClick={(event) => event.stopPropagation()}>
        <div className="preview-head">
          <strong>Önizleme — {doc.fileName}</strong>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Kapat
          </button>
        </div>
        <div className="preview-body">
          {kind === 'image' ? <img src={doc.dataUrl} alt={doc.fileName} /> : null}
          {kind === 'pdf' ? (
            <iframe title={doc.fileName} src={doc.dataUrl} />
          ) : null}
          {kind === 'other' ? (
            <p className="muted">
              Bu dosya türü tarayıcıda görsel olarak açılamıyor. İndirmeden yalnızca yüklenmiş olduğunu
              kontrol edebilirsiniz.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function previewKind(doc: UploadedDoc) {
  const name = doc.fileName.toLowerCase()
  const type = doc.fileType
  if (type.startsWith('image/') || /\.(jpe?g|png|gif|webp|tiff?)$/.test(name)) return 'image'
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  return 'other'
}

function guessType(name: string) {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (/\.jpe?g$/.test(lower)) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (/\.tiff?$/.test(lower)) return 'image/tiff'
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (lower.endsWith('.doc')) return 'application/msword'
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
