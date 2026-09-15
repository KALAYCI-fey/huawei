import type {
  AttendanceStatus,
  IskurBildirimDurumu,
  ProgramStatus,
  TraineeStatus,
} from './types'

export function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function maskTc(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return value
  return `${digits.slice(0, 3)}****${digits.slice(7)}`
}

export function programStatusLabel(status: ProgramStatus) {
  const map: Record<ProgramStatus, string> = {
    taslak: 'Taslak',
    basvuru: 'Başvuru',
    onaylandi: 'Onaylandı',
    devam: 'Devam ediyor',
    tamamlandi: 'Tamamlandı',
    iptal: 'İptal',
  }
  return map[status]
}

export function traineeStatusLabel(status: TraineeStatus) {
  const map: Record<TraineeStatus, string> = {
    aday: 'Aday',
    onaylandi: 'Onaylandı',
    isbasi: 'İşbaşı yapıldı',
    devam: 'Eğitimde',
    tamamlandi: 'Tamamlandı',
    ayrildi: 'Ayrıldı',
  }
  return map[status]
}

export function bildirimLabel(status: IskurBildirimDurumu) {
  const map: Record<IskurBildirimDurumu, string> = {
    bekliyor: 'Hazırlık bekliyor',
    hazir: 'e-Şube için hazır',
    e_sube_isaretlendi: 'e-Şube işaretlendi',
    onaylandi: 'İŞKUR onaylı',
  }
  return map[status]
}

export function attendanceLabel(status: AttendanceStatus) {
  const map: Record<AttendanceStatus, string> = {
    geldi: 'Geldi',
    gelmedi: 'Gelmedi',
    izinli: 'İzinli',
    raporlu: 'Raporlu',
  }
  return map[status]
}

export function isValidTc(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 11
}
