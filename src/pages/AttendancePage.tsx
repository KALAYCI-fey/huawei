import { useMemo, useState } from 'react'
import { attendanceLabel, formatDate } from '../format'
import { newId, upsertAttendance, useAppState } from '../store'
import type { AttendanceStatus } from '../types'

function weekDates(anchor: string) {
  const date = new Date(`${anchor}T00:00:00`)
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(monday)
    next.setDate(monday.getDate() + index)
    return next.toISOString().slice(0, 10)
  })
}

export function AttendancePage() {
  const { trainees, attendance, jobStarts } = useAppState()
  const [anchor, setAnchor] = useState(new Date().toISOString().slice(0, 10))
  const days = useMemo(() => weekDates(anchor), [anchor])
  const active = trainees.filter((item) =>
    jobStarts.some((start) => start.traineeId === item.id) &&
    (item.status === 'isbasi' || item.status === 'devam'),
  )

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Yoklama</h1>
          <p className="muted">İşbaşı yapmış kursiyerler için haftalık devam kaydı.</p>
        </div>
        <input type="date" value={anchor} onChange={(event) => setAnchor(event.target.value)} />
      </div>
      <div className="att-grid">
        <div className="att-head">Kursiyer</div>
        {days.map((day) => (
          <div key={day} className="att-head">
            {formatDate(day)}
          </div>
        ))}
        {active.map((trainee) => (
          <div key={trainee.id} style={{ display: 'contents' }}>
            <div className="att-name">
              <strong>
                {trainee.ad} {trainee.soyad}
              </strong>
            </div>
            {days.map((day) => {
              const record = attendance.find(
                (item) => item.traineeId === trainee.id && item.tarih === day,
              )
              return (
                <div key={`${trainee.id}-${day}`} className="att-cell">
                  <select
                    value={record?.durum ?? ''}
                    onChange={(event) => {
                      const durum = event.target.value as AttendanceStatus | ''
                      if (!durum) return
                      upsertAttendance({
                        id: record?.id ?? newId('att'),
                        traineeId: trainee.id,
                        tarih: day,
                        durum,
                        girisSaati: record?.girisSaati ?? (durum === 'geldi' ? '08:00' : ''),
                        cikisSaati: record?.cikisSaati ?? '',
                        aciklama: record?.aciklama ?? '',
                      })
                    }}
                  >
                    <option value="">—</option>
                    <option value="geldi">{attendanceLabel('geldi')}</option>
                    <option value="gelmedi">{attendanceLabel('gelmedi')}</option>
                    <option value="izinli">{attendanceLabel('izinli')}</option>
                    <option value="raporlu">{attendanceLabel('raporlu')}</option>
                  </select>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {active.length === 0 ? (
        <div className="card empty" style={{ marginTop: 16 }}>
          Yoklama için işbaşı kaydı olan aktif kursiyer yok.
        </div>
      ) : null}
    </div>
  )
}
