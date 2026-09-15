import { useMemo, useState, type ReactNode } from 'react'
import { ILLER, ILCELER, MESLEKLER, OGRENIM } from '../data/lookups'
import type { Program, YesNo } from '../types'

const WEEK = ['PAZTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR']

export function IepBilgilerForm({
  draft,
  setDraft,
  fiiliGun,
}: {
  draft: Program
  setDraft: (next: Program) => void
  fiiliGun: number
}) {
  const [meslekQuery, setMeslekQuery] = useState(draft.meslek)
  const ilceler = ILCELER[draft.uygulamaIl] ?? []
  const meslekler = useMemo(() => {
    const q = meslekQuery.trim().toLowerCase()
    if (q.length < 3) return []
    return MESLEKLER.filter((item) => item.toLowerCase().includes(q))
  }, [meslekQuery])

  const ozet = [
    `IEP KES SAYISI: ${draft.iepKesSayisi}`,
    `KONTENJAN SAYISI: ${draft.kontenjanSayisi}`,
    `KONTENJANINDAN KULLANILAN: ${draft.kontenjanKullanilan}`,
    `*${draft.kontenjanIl.toUpperCase() || 'İL'}: İşbaşı Eğitim Programı (IEP)`,
    `KONTENJANINDAN KALAN: ${Math.max(draft.kontenjanSayisi - draft.kontenjanKullanilan, 0)}`,
  ].join('\n')

  return (
    <div className="iep-sheet">
      <div>
        <Field label="Kontenjan İl:" green>
          <select
            className="green"
            value={draft.kontenjanIl}
            onChange={(event) => setDraft({ ...draft, kontenjanIl: event.target.value })}
          >
            <option value="">Seçiniz</option>
            {ILLER.map((il) => (
              <option key={il} value={il}>
                {il}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Uygulama İl:" green>
          <select
            className="green"
            value={draft.uygulamaIl}
            onChange={(event) =>
              setDraft({
                ...draft,
                uygulamaIl: event.target.value,
                uygulamaIlce: '',
              })
            }
          >
            <option value="">Seçiniz</option>
            {ILLER.map((il) => (
              <option key={il} value={il}>
                {il}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Uygulama İlçe:" green>
          <select
            className="green"
            value={draft.uygulamaIlce}
            onChange={(event) => setDraft({ ...draft, uygulamaIlce: event.target.value })}
          >
            <option value="">Seçiniz</option>
            {ilceler.map((ilce) => (
              <option key={ilce} value={ilce}>
                {ilce}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Uygulama Adres:" green>
          <input
            className="green"
            value={draft.uygulamaAdres}
            onChange={(event) => setDraft({ ...draft, uygulamaAdres: event.target.value })}
          />
        </Field>
        <Field label="Meslek:" green>
          <div>
            <input
              className="green"
              list="meslek-list"
              placeholder="Üç Harf Giriniz."
              value={meslekQuery}
              onChange={(event) => {
                setMeslekQuery(event.target.value)
                setDraft({ ...draft, meslek: event.target.value })
              }}
            />
            <datalist id="meslek-list">
              {meslekler.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <small className="hint-inline">Üç Harf Giriniz.</small>
          </div>
        </Field>
        <Field label="Öğrenim Durumu Alt/Üst:" green>
          <div className="iep-pair">
            <select
              className="green"
              value={draft.ogrenimAlt}
              onChange={(event) => setDraft({ ...draft, ogrenimAlt: event.target.value })}
            >
              {OGRENIM.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="green"
              value={draft.ogrenimUst}
              onChange={(event) => setDraft({ ...draft, ogrenimUst: event.target.value })}
            >
              {OGRENIM.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </Field>
        {draft.meslek ? (
          <p className="iep-info">
            “{draft.meslek}” mesleği için minimum öğrenim durumu “{draft.ogrenimAlt || 'İlköğretim'}” olarak
            girilmelidir.
          </p>
        ) : null}
        <Field label="Yaş Aralığı:" green>
          <div className="iep-pair">
            <input
              className="green"
              type="number"
              min={15}
              max={65}
              value={draft.yasMin}
              onChange={(event) => setDraft({ ...draft, yasMin: Number(event.target.value) })}
            />
            <input
              className="green"
              type="number"
              min={15}
              max={65}
              value={draft.yasMax}
              onChange={(event) => setDraft({ ...draft, yasMax: Number(event.target.value) })}
            />
          </div>
        </Field>
        <Field label="Aynı veya Yakın Meslekte Program Düzenlenecek İşyerinizde Sigortalınız Var Mı?:" green>
          <YesNoToggle
            value={draft.ayniMeslekteSigortali}
            onChange={(value) => setDraft({ ...draft, ayniMeslekteSigortali: value })}
          />
        </Field>
        <Field label="İstihdam Taahhüt Oranı:" green>
          <div className="oran-row">
            <span>%</span>
            <input
              className="green"
              type="number"
              min={0}
              max={100}
              value={draft.istihdamTaahhutOran}
              onChange={(event) =>
                setDraft({ ...draft, istihdamTaahhutOran: Number(event.target.value) })
              }
            />
          </div>
        </Field>
        <Field label="İstihdam Yükümlülüğü Süresi:">
          <input className="readonly" readOnly value={draft.istihdamYukumluluguSuresi} />
        </Field>
        <Field label="Geleceğin Mesleği Kapsamında:" green>
          <YesNoToggle
            value={draft.geleceginMeslegi}
            onChange={(value) => setDraft({ ...draft, geleceginMeslegi: value })}
          />
        </Field>
        <Field label="İmalat Bilişim Kapsamında:" green>
          <YesNoToggle
            value={draft.imalatBilisim}
            onChange={(value) => setDraft({ ...draft, imalatBilisim: value })}
          />
        </Field>
        <Field label="Tehlikeli Meslek:" green>
          <YesNoToggle
            value={draft.tehlikeliMeslek}
            onChange={(value) => setDraft({ ...draft, tehlikeliMeslek: value })}
          />
        </Field>
      </div>

      <div>
        <Field label="Başlangıç Tarihi:" green>
          <input
            className="green"
            type="date"
            value={draft.baslangic}
            onChange={(event) => setDraft(withDates(draft, { baslangic: event.target.value }))}
          />
        </Field>
        <Field label="Bitiş Tarihi:" green>
          <input
            className="green"
            type="date"
            value={draft.bitis}
            onChange={(event) => setDraft(withDates(draft, { bitis: event.target.value }))}
          />
        </Field>
        <WeekRow label="İlk Hafta :" value={draft.ilkHafta} onChange={(ilkHafta) => setDraft({ ...draft, ilkHafta })} />
        <WeekRow
          label="Devam Eden Haftalar :"
          value={draft.devamHafta}
          onChange={(devamHafta) => setDraft({ ...draft, devamHafta })}
        />
        <WeekRow label="Son Hafta :" value={draft.sonHafta} onChange={(sonHafta) => setDraft({ ...draft, sonHafta })} />
        <p className="iep-info">
          Resmi tatillerde ve bayram tatillerinde il istihdam ve mesleki eğitim kurulunun onayı alınmadan
          program düzenlenemez. Konuyla ilgili başvurunun şartları taşıyıp taşımadığının kontrol edilmesi
          gerekmektedir.
        </p>
        <Field label="Fiili Gün:">
          <input className="readonly" readOnly value={fiiliGun} />
        </Field>
        <Field label="Fiili Dörtte Birlik Süre Tarihi:">
          <input
            type="date"
            className="readonly"
            readOnly
            value={draft.fiiliDortteBirlikTarih}
          />
        </Field>
        <Field label={`Kontenjan İl Özet Bilgi (${draft.kontenjanIl || 'İL'}):`}>
          <textarea className="readonly ozet" readOnly rows={7} value={ozet} />
        </Field>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  green,
}: {
  label: string
  children: ReactNode
  green?: boolean
}) {
  return (
    <div className={`iep-row ${green ? 'is-green' : ''}`}>
      <span>{label}</span>
      {children}
    </div>
  )
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: YesNo
  onChange: (value: YesNo) => void
}) {
  const isYes = value === 'evet'
  return (
    <button
      type="button"
      className={`yn-switch ${isYes ? 'yes' : 'no'}`}
      aria-pressed={isYes}
      onClick={() => onChange(isYes ? 'hayir' : 'evet')}
    >
      <span className="yn-evet">EVET</span>
      <span className="yn-hayir">HAYIR</span>
    </button>
  )
}

function WeekRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean[]
  onChange: (value: boolean[]) => void
}) {
  return (
    <div className="iep-row">
      <span>{label}</span>
      <div className="week-days official">
        {WEEK.map((day, index) => (
          <label key={day} className={value[index] ? 'day-on' : ''}>
            <input
              type="checkbox"
              checked={Boolean(value[index])}
              onChange={(event) => {
                const next = [...value]
                next[index] = event.target.checked
                onChange(next)
              }}
            />
            {day}
          </label>
        ))}
      </div>
    </div>
  )
}

function withDates(draft: Program, patch: Partial<Program>): Program {
  const next = { ...draft, ...patch }
  if (next.baslangic && next.bitis) {
    const start = new Date(`${next.baslangic}T00:00:00`)
    const end = new Date(`${next.bitis}T00:00:00`)
    const span = end.getTime() - start.getTime()
    if (span > 0) {
      const quarter = new Date(start.getTime() + span / 4)
      next.fiiliDortteBirlikTarih = quarter.toISOString().slice(0, 10)
    }
  }
  return next
}
