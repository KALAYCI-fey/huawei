# İŞKUR İşbaşı Modülü

İşverenlerin İŞKUR **işbaşı eğitim programı (İEP)** süreçlerini içeride takip etmesi için bir web uygulaması.

Resmi İŞKUR e-Şube değildir. e-Devlet veya `esube.iskur.gov.tr` girişi yapılmaz; resmi bildirimler İŞKUR üzerinden ayrıca tamamlanır.

## Özellikler

- İEP başvuru: firma seçimi, yeşil doldurulabilir alanlar, evet/hayır soruları, belge yükleme sekmeleri
- Program dosyaları (kontenjan, meslek kodu, İŞKUR dosya no)
- Kursiyer kayıtları
- İşbaşı bildirimi: tarih, görev, çalışma yeri, belge kontrolü, e-Şube durumu
- Haftalık yoklama
- İşveren bilgileri

Veriler tarayıcı `localStorage` içinde tutulur.

## Çalıştırma

```bash
npm install
npm run dev
```

Demo giriş: T.C. kimlik no ve işveren şifresi (yerel uygulama; resmi İŞKUR e-Şube değildir).

## Derleme

```bash
npm run build
```
