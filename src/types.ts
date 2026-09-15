export type ProgramStatus =
  | 'taslak'
  | 'basvuru'
  | 'onaylandi'
  | 'devam'
  | 'tamamlandi'
  | 'iptal'

export type TraineeStatus =
  | 'aday'
  | 'onaylandi'
  | 'isbasi'
  | 'devam'
  | 'tamamlandi'
  | 'ayrildi'

export type AttendanceStatus = 'geldi' | 'gelmedi' | 'izinli' | 'raporlu'

export type IskurBildirimDurumu =
  | 'bekliyor'
  | 'hazir'
  | 'e_sube_isaretlendi'
  | 'onaylandi'

export interface Employer {
  unvan: string
  vergiNo: string
  sgkSicilNo: string
  il: string
  ilce: string
  adres: string
  yetkili: string
  telefon: string
  eposta: string
}

export interface Program {
  id: string
  ad: string
  iskurDosyaNo: string
  meslek: string
  meslekKodu: string
  kontenjan: number
  baslangic: string
  bitis: string
  gunlukSaat: number
  toplamGun: number
  status: ProgramStatus
  aciklama: string
}

export interface Trainee {
  id: string
  programId: string
  tcKimlikNo: string
  ad: string
  soyad: string
  dogumTarihi: string
  telefon: string
  eposta: string
  meslek: string
  status: TraineeStatus
}

export interface JobStart {
  id: string
  traineeId: string
  programId: string
  isbasiTarihi: string
  unvanGorev: string
  calismaYeri: string
  vardiya: string
  sgkBildirimi: boolean
  iskurBildirimDurumu: IskurBildirimDurumu
  sozlesme: boolean
  kimlikFotokopi: boolean
  sgkIseGiris: boolean
  notlar: string
  createdAt: string
}

export interface AttendanceRecord {
  id: string
  traineeId: string
  tarih: string
  durum: AttendanceStatus
  girisSaati: string
  cikisSaati: string
  aciklama: string
}

export interface AppState {
  employer: Employer
  programs: Program[]
  trainees: Trainee[]
  jobStarts: JobStart[]
  attendance: AttendanceRecord[]
}
