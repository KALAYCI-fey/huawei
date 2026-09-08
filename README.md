# huawei

OEDAŞ OSOS müşteri portalındaki abone, endeks, tüketim ve yük profili verilerini yerel SQLite deposuna aktarır; üretim tesisatlarını Huawei FusionSolar santralleriyle eşler.

## OSOS

Kaynak: [ososout.oedas.com.tr](https://ososout.oedas.com.tr) (ARiL müşteri portalı)

| Tablo | Kaynak servis | İçerik |
|---|---|---|
| `subscribers` | `GetCustomerPortalSubscriptions` | Tesisat, sayaç, çarpan, ETSO, tarife, güç |
| `monthly_endex` | `GetOwnerMontlyEndexConsumptions` | Aylık T1/T2/T3, reaktif |
| `consumptions` | `GetOwnerConsumptions` | Saatlik tüketim / üretim / reaktif |
| `load_profiles` | `GetOwnerLoadProfiles` | 15 dakikalık yük profili |
| `current_endexes` | `GetCurrentEndexes` | Güncel endeks |

Eşleme anahtarı **tesisat numarasıdır**. ETSO (`40Z…`) tekil değildir; aynı ETSO birden fazla tesisatta görülebilir.

Üretim tesisleri `definition_type = 15` (`GenerationPlant`), tüketim aboneleri `2` (`Subscriber`). Saatlik üretim `consumptions.generation_kwh` alanındadır.

## Kurulum

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` içine OSOS ve (varsa) FusionSolar Northbound bilgilerini yazın. Northbound hesabı, FusionSolar web girişinden ayrıdır.

```
OSOS_USERNAME=your.username
OSOS_PASSWORD=your.password
HUAWEI_USERNAME=
HUAWEI_SYSTEM_CODE=
HUAWEI_BASE_URL=https://eu5.fusionsolar.huawei.com
```

## OSOS kullanımı

```bash
python -m osos login
python -m osos subscribers
python -m osos sync --from 2026-09-01 --to 2026-09-08
python -m osos status
```

## Huawei eşlemesi

1. FusionSolar santrallerini çekin (Northbound hesabı gerekir):

```bash
python -m osos huawei-login
python -m osos huawei-plants
```

2. Tesisat listesini CSV olarak dışa alın, `plant_code` sütununu doldurun, geri yükleyin:

```bash
python -m osos map-export --out data/site_mappings.csv
# CSV'de plant_code = FusionSolar plantCode (ör. NE=…)
python -m osos map-import --file data/site_mappings.csv
```

Örnek şablon: `examples/site_mappings.example.csv`

Tek kayıt:

```bash
python -m osos map-set --tesisat 10000091010 --plant-code NE=SANTRAL_ID --plant-name "Afyon GES"
```

Ada/adrese göre öneri (önce `huawei-plants`):

```bash
python -m osos map-suggest
python -m osos map-suggest --apply
python -m osos map-list
```

3. Huawei üretimini çekip OSOS ile karşılaştırın:

```bash
python -m osos huawei-sync --from 2026-09-01 --to 2026-09-08
python -m osos compare --from 2026-09-01 --to 2026-09-08
```

`compare` eşlenmiş tesisatlarda `generation_kwh` (OSOS, çarpan uygulanmış) ile `inverter_power` (Huawei saatlik kWh) farkını verir.

FusionSolar resmi olarak saatlik KPI için dakikada yaklaşık 1 istek sınırlar. Gerekirse `--sleep 61` kullanın.

## Güvenlik

- Şifreyi sohbet, PR veya git geçmişine yazmayın.
- `data/` ve `.env` `.gitignore` içindedir.
