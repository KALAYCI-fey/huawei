# huawei

OEDAŞ OSOS (Otomatik Sayaç Okuma Sistemi) müşteri portalındaki abone, endeks, tüketim ve yük profili verilerini yerel bir uygulama modülüne aktarır.

Kaynak: [ososout.oedas.com.tr](https://ososout.oedas.com.tr) (ARiL müşteri portalı)

## Ne yapar

Portalın kendi REST/ESB API'sine giriş yapar, portföydeki tesisatları çeker ve SQLite'a yazar:

| Tablo | Kaynak servis | İçerik |
|---|---|---|
| `subscribers` | `GetCustomerPortalSubscriptions` | Tesisat, sayaç, çarpan, ETSO, tarife, güç |
| `monthly_endex` | `GetOwnerMontlyEndexConsumptions` | Aylık T1/T2/T3, reaktif |
| `consumptions` | `GetOwnerConsumptions` | Saatlik tüketim / üretim / reaktif |
| `load_profiles` | `GetOwnerLoadProfiles` | 15 dakikalık yük profili |
| `current_endexes` | `GetCurrentEndexes` | Güncel endeks |

Şifre repoya yazılmaz. Kimlik bilgileri yalnızca `.env` içindedir.

## Kurulum

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` içine OSOS kullanıcı adı ve şifresini yazın:

```
OSOS_USERNAME=your.username
OSOS_PASSWORD=your.password
```

## Kullanım

```bash
# Girişi doğrula
python -m osos login

# Sadece tesisat listesi
python -m osos subscribers

# Bu ayın verisini çek (tüketim + 15 dk profil)
python -m osos sync

# Tarih aralığı (bitiş günü dahil)
python -m osos sync --from 2026-09-01 --to 2026-09-08

# Yük profili olmadan daha hızlı çekim
python -m osos sync --from 2026-09-01 --to 2026-09-08 --no-profiles

# Yerel kayıt sayıları
python -m osos status
```

Varsayılan veritabanı: `data/osos.db`

## Huawei / EMS eşlemesi

Tesisat numarası (`subscribers.tesisat`) ve ETSO (`etso`) hedef sistemdeki site/inverter kaydına bağlanacak anahtarlardır. Üretim tesisleri `definition_type = 15` (`GenerationPlant`), tüketim aboneleri `2` (`Subscriber`). Saatlik üretim `consumptions.generation_kwh` alanındadır.

## Güvenlik

- Şifreyi sohbet, PR veya git geçmişine yazmayın.
- Şifre bir sohbette paylaşıldıysa OSOS portalından değiştirin.
- `data/` ve `.env` `.gitignore` içindedir.
