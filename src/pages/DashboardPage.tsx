import { Link } from 'react-router-dom'
import { BildirimBadge } from '../components/Badges'
import { formatDate } from '../format'
import { useAppState } from '../store'

export function DashboardPage() {
  const { programs, trainees, jobStarts, attendance, employer } = useAppState()
  const activePrograms = programs.filter((item) => item.status === 'devam' || item.status === 'onaylandi')
  const activeTrainees = trainees.filter((item) => item.status === 'devam' || item.status === 'isbasi')
  const pendingStarts = trainees.filter(
    (item) =>
      (item.status === 'onaylandi' || item.status === 'aday') &&
      !jobStarts.some((start) => start.traineeId === item.id),
  )
  const today = new Date().toISOString().slice(0, 10)
  const todayAttendance = attendance.filter((item) => item.tarih === today)
  const came = todayAttendance.filter((item) => item.durum === 'geldi').length

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Özet</h1>
          <p className="muted">
            {employer.unvan} için İEP kontenjan, işbaşı ve yoklama durumu.
          </p>
        </div>
        <Link className="btn btn-primary" to="/isbasi">
          Yeni işbaşı kaydı
        </Link>
      </div>

      <div className="grid stats">
        <div className="card">
          <p className="muted">Aktif program</p>
          <p className="stat-value">{activePrograms.length}</p>
        </div>
        <div className="card">
          <p className="muted">İşbaşındaki kursiyer</p>
          <p className="stat-value">{activeTrainees.length}</p>
        </div>
        <div className="card">
          <p className="muted">İşbaşı bekleyen</p>
          <p className="stat-value">{pendingStarts.length}</p>
        </div>
        <div className="card">
          <p className="muted">Bugün gelen</p>
          <p className="stat-value">
            {came}/{todayAttendance.length || activeTrainees.length}
          </p>
        </div>
      </div>

      <div className="split" style={{ marginTop: 16 }}>
        <div className="card">
          <h2 className="section-title">Son işbaşı kayıtları</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Kursiyer</th>
                  <th>Tarih</th>
                  <th>İŞKUR</th>
                </tr>
              </thead>
              <tbody>
                {jobStarts.slice(0, 6).map((item) => {
                  const trainee = trainees.find((row) => row.id === item.traineeId)
                  return (
                    <tr key={item.id}>
                      <td>
                        {trainee ? `${trainee.ad} ${trainee.soyad}` : item.traineeId}
                      </td>
                      <td>{formatDate(item.isbasiTarihi)}</td>
                      <td>
                        <BildirimBadge status={item.iskurBildirimDurumu} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2 className="section-title">e-Şube kontrol listesi</h2>
          <ol className="checklist">
            <li>Kursiyer belgelerini ve sözleşmeyi bu ekranda tamamlayın.</li>
            <li>SGK işe giriş bildirgesini ayrı sistemden alın.</li>
            <li>Resmi işbaşı bildirimini esube.iskur.gov.tr üzerinden girin.</li>
            <li>Burada durumu “e-Şube işaretlendi / İŞKUR onaylı” olarak güncelleyin.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
