import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout, useAppState } from '../store'

const links = [
  { to: '/', label: 'Özet' },
  { to: '/programlar', label: 'Programlar' },
  { to: '/kursiyerler', label: 'Kursiyerler' },
  { to: '/isbasi', label: 'İşbaşı' },
  { to: '/yoklama', label: 'Yoklama' },
  { to: '/isveren', label: 'İşveren' },
]

export function Layout() {
  const { employer } = useAppState()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">İŞ</div>
          <div>
            <strong>İşbaşı Modülü</strong>
            <small>İŞKUR İEP takip</small>
          </div>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div>{employer.unvan}</div>
          <div className="muted" style={{ color: '#c9d8ea' }}>
            {employer.il} / {employer.ilce}
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <strong>İŞKUR işbaşı eğitim takibi</strong>
            <p className="muted">
              Kayıtları burada hazırlayın; resmi bildirimi İŞKUR e-Şube üzerinden yapın.
            </p>
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              logout()
              navigate('/giris')
            }}
          >
            Çıkış
          </button>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
