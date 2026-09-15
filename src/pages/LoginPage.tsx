import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { completeEmployerLogin, credentialsOk, isAuthenticated, useAppState } from '../store'

export function LoginPage() {
  const navigate = useNavigate()
  const { workplaces } = useAppState()
  const [step, setStep] = useState<'kimlik' | 'firma'>('kimlik')
  const [username, setUsername] = useState('isveren')
  const [password, setPassword] = useState('')
  const [firmaId, setFirmaId] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated()) {
    return <Navigate to="/programlar" replace />
  }

  function onCredentials(event: FormEvent) {
    event.preventDefault()
    if (!credentialsOk(username, password)) {
      setError('Kullanıcı adı veya şifre hatalı.')
      return
    }
    setError('')
    setFirmaId('')
    setStep('firma')
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
    <div className="login-page">
      <div className="iskur-modal">
        <div className="iskur-modal-title">
          <h1>İşveren Giriş</h1>
          <button type="button" className="iskur-x" aria-label="Kapat" onClick={() => setStep('kimlik')}>
            ×
          </button>
        </div>

        {step === 'kimlik' ? (
          <form className="iskur-modal-body" onSubmit={onCredentials}>
            <p className="login-hint">
              Demo: <strong>isveren</strong> / <strong>demo123</strong>
            </p>
            <div className="iskur-row">
              <label htmlFor="username">Kullanıcı</label>
              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
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
            {error ? <p className="error light">{error}</p> : null}
            <div className="iskur-actions">
              <button className="iskur-btn" type="submit">
                İleri
              </button>
            </div>
          </form>
        ) : (
          <form className="iskur-modal-body" onSubmit={onFirmLogin}>
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
          </form>
        )}

        <div className="iskur-modal-foot">
          <button className="iskur-kapat" type="button" onClick={() => setStep('kimlik')}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
