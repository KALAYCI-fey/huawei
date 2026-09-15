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

export type YesNo = 'evet' | 'hayir' | ''

export interface Workplace {
  id: string
  unvan: string
  sgkSicilNo: string
  il: string
  ilce: string
  adres: string
}

export interface UploadedDoc {
  tur: DocumentKind
  fileName: string
  fileType: string
  dataUrl: string
  uploadedAt: string
}

export type DocumentKind =
  | 'talep_dilekcesi'
  | 'isveren_belgesi'
  | 'imza_yetki'
  | 'ortaklik'
  | 'sigortali_belge'
  | 'tehlikeli_egitim'
  | 'diger'

export interface Program {
  id: string
  firmaId: string
  ad: string
  iskurDosyaNo: string
  kursNo: string
  meslek: string
  meslekKodu: string
  kontenjan: number
  baslangic: string
  bitis: string
  gunlukSaat: number
  toplamGun: number
  status: ProgramStatus
  aciklama: string
  kontenjanIl: string
  kontenjanIlce: string
  uygulamaIl: string
  uygulamaIlce: string
  uygulamaAdres: string
  ogrenimAlt: string
  ogrenimUst: string
  yasMin: number
  yasMax: number
  kursDurum: string
  basvuruTarih: string
  tatilGunleri: string[]
  fiiliDortteBirlikTarih: string
  iepKesSayisi: number
  kontenjanSayisi: number
  kontenjanKullanilan: number
  ayniMeslekteSigortali: YesNo
  geleceginMeslegi: YesNo
  imalatBilisim: YesNo
  tehlikeliMeslek: YesNo
  programIlani: YesNo
  istihdamTaahhutOran: number
  istihdamYukumluluguSuresi: number
  erkekKursiyer: number
  kadinKursiyer: number
  calisanSayisi: number
  kalanKontenjan: number
  ilkHafta: boolean[]
  devamHafta: boolean[]
  sonHafta: boolean[]
  belgeler: UploadedDoc[]
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
  workplaces: Workplace[]
  programs: Program[]
  trainees: Trainee[]
  jobStarts: JobStart[]
  attendance: AttendanceRecord[]
}
