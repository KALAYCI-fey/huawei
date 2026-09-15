import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isAuthenticated, login } from '../store'

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('isveren')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (login(username, password)) {
      navigate('/')
      return
    }
    setError('Kullanıcı adı veya şifre hatalı.')
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-head">
          <h1 style={{ margin: 0, fontSize: 24 }}>İşveren Giriş</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
            İŞKUR işbaşı eğitim programı takip ekranı
          </p>
        </div>
        <div className="login-body">
          <p className="notice">
            Bu uygulama resmi İŞKUR e-Şube değildir. Demo giriş: kullanıcı{' '}
            <strong>isveren</strong>, şifre <strong>demo123</strong>.
          </p>
          <label>
            <span>Kullanıcı adı</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            <span>Şifre</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn btn-primary" type="submit">
            Giriş
          </button>
        </div>
      </form>
    </div>
  )
}
