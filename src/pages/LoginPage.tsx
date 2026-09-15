import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { completeEmployerLogin, credentialsOk, isAuthenticated, useAppState } from '../store'

export function LoginPage() {
  const navigate = useNavigate()
  const { workplaces } = useAppState()
  const [panel, setPanel] = useState<'kapali' | 'giris' | 'firma'>('kapali')
  const [tcKimlikNo, setTcKimlikNo] = useState('')
  const [password, setPassword] = useState('')
  const [firmaId, setFirmaId] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated()) {
    return <Navigate to="/programlar" replace />
  }

  function onCredentials(event: FormEvent) {
    event.preventDefault()
    if (!credentialsOk(tcKimlikNo, password)) {
      setError('T.C. kimlik no veya şifre hatalı.')
      return
    }
    setError('')
    setFirmaId('')
    setPanel('firma')
  }

  function onFirmLogin(event: FormEvent) {
    event.preventDefault()
    if (!firmaId) {
      setError('Lütfen firma seçiniz.')
      return
    }
    completeEmployerLogin(firmaId)
    navigate('/programlar')
  }

  return (
    <div className="esube">
      <header className="esube-top">
        <div className="esube-brand">
          <div className="esube-logo">İŞ</div>
          <div>
            <strong>İŞKUR</strong>
            <small>TÜRKİYE İŞ KURUMU</small>
          </div>
        </div>
        <span>İŞKUR E-ŞUBE</span>
      </header>

      <div className="esube-body">
        <div className="esube-cards">
          <section className="esube-card">
            <h2>İş Arayan</h2>
            <div className="esube-icon seeker" aria-hidden>
              <svg viewBox="0 0 80 80" width="88" height="88">
                <circle cx="40" cy="22" r="12" fill="#8aa4c0" />
                <path d="M18 70c4-18 14-26 22-26s18 8 22 26" fill="#8aa4c0" />
                <rect x="28" y="40" width="24" height="16" rx="2" fill="#1c6fb8" />
              </svg>
            </div>
            <div className="esube-btns">
              <button type="button" disabled>
                Giriş
              </button>
              <button type="button" disabled>
                Üye Ol
              </button>
            </div>
            <button className="esube-link" type="button" disabled>
              Şifremi Unuttum
            </button>
            <button className="esube-link" type="button" disabled>
              Danışmanım Kim?
            </button>
          </section>

          <section className="esube-card employer">
            <h2>İşveren</h2>
            <div className="esube-icon" aria-hidden>
              <svg viewBox="0 0 80 80" width="88" height="88">
                <circle cx="40" cy="20" r="10" fill="#5b7c9a" />
                <circle cx="22" cy="28" r="7" fill="#8aa4c0" />
                <circle cx="58" cy="28" r="7" fill="#8aa4c0" />
                <path d="M12 70c3-14 10-20 18-20h20c8 0 15 6 18 20" fill="#5b7c9a" />
              </svg>
            </div>
            <div className="esube-btns">
              <button
                type="button"
                className={panel !== 'kapali' ? 'on' : ''}
                onClick={() => {
                  setPanel('giris')
                  setError('')
                }}
              >
                Giriş
              </button>
              <button type="button" disabled>
                Üye Ol
              </button>
              <button type="button" disabled>
                Yeni İlan
              </button>
            </div>
            <button className="esube-link" type="button" disabled>
              Bireysel İşveren Üye Ol
            </button>
            <button className="esube-link" type="button" disabled>
              Danışmanım Kim?
            </button>
            <button className="esube-link" type="button" disabled>
              İşveren olarak kayıtlı mıyım?
            </button>
          </section>
        </div>

        <div className="esube-tiles">
          <button type="button">İş İlanları</button>
          <button type="button">Mesleki Eğitim Kursları</button>
          <button type="button" className="tile-iep">
            İşbaşı Eğitim Programları
          </button>
          <button type="button">Toplum Yararına Programlar</button>
          <button type="button">İşsizlik Ödeneği</button>
          <button type="button">Staj Portalı</button>
        </div>
        <button className="esube-hizmet" type="button" disabled>
          Hizmet Noktası Giriş
        </button>
      </div>

      {panel === 'giris' ? (
        <div className="modal-backdrop">
          <form className="iskur-modal" onSubmit={onCredentials}>
            <div className="iskur-modal-title">
              <h1>İşveren Giriş</h1>
              <button type="button" className="iskur-x" onClick={() => setPanel('kapali')}>
                ×
              </button>
            </div>
            <div className="iskur-modal-body">
              <div className="iskur-row">
                <label htmlFor="tc">T.C. Kimlik No</label>
                <input
                  id="tc"
                  inputMode="numeric"
                  maxLength={11}
                  value={tcKimlikNo}
                  onChange={(event) => setTcKimlikNo(event.target.value.replace(/\D/g, '').slice(0, 11))}
                  autoComplete="username"
                />
              </div>
              <div className="iskur-row">
                <label htmlFor="password">Şifre</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <p className="iskur-links">
                <button type="button" disabled>
                  Yeni Üye
                </button>
                <span>|</span>
                <button type="button" disabled>
                  Şifremi Unuttum
                </button>
              </p>
              {error ? <p className="error light">{error}</p> : null}
              <div className="iskur-actions stacked">
                <button className="iskur-btn" type="submit">
                  İşveren Giriş
                </button>
                <button
                  className="iskur-edevlet"
                  type="button"
                  onClick={() =>
                    setError('e-Devlet girişi bu yerel uygulamada kapalıdır; resmi e-Devlet veya e-Şube kullanılmaz.')
                  }
                >
                  e-Devlet ile Giriş
                </button>
              </div>
            </div>
            <div className="iskur-modal-foot">
              <button className="iskur-kapat" type="button" onClick={() => setPanel('kapali')}>
                Kapat
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {panel === 'firma' ? (
        <div className="modal-backdrop">
          <form className="iskur-modal" onSubmit={onFirmLogin}>
            <div className="iskur-modal-title">
              <h1>İşveren Giriş</h1>
              <button type="button" className="iskur-x" onClick={() => setPanel('giris')}>
                ×
              </button>
            </div>
            <div className="iskur-modal-body">
              <div className="iskur-row">
                <label htmlFor="firma">Firma</label>
                <select
                  id="firma"
                  value={firmaId}
                  onChange={(event) => {
                    setFirmaId(event.target.value)
                    setError('')
                  }}
                >
                  <option value="">Lütfen Firma Seçiniz...</option>
                  {workplaces.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.unvan}
                    </option>
                  ))}
                </select>
              </div>
              {error ? <p className="error light">{error}</p> : null}
              <div className="iskur-actions">
                <button className="iskur-btn" type="submit">
                  İşveren Giriş
                </button>
                <button
                  className="iskur-btn"
                  type="button"
                  onClick={() => {
                    setFirmaId('')
                    setError('')
                  }}
                >
                  Temizle
                </button>
              </div>
            </div>
            <div className="iskur-modal-foot">
              <button className="iskur-kapat" type="button" onClick={() => setPanel('giris')}>
                Kapat
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
