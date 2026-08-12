# Huawei - Masaüstü Uygulama Kısayolu

Bu proje, bir web sitesini veya programı masaüstü uygulaması gibi açmanızı ve masaüstüne kısayol oluşturmanızı sağlar.

## Hızlı Başlangıç

### 1. Ayarları düzenleyin

`config.json` dosyasını açın ve uygulamanızı yapılandırın:

```json
{
  "appName": "Huawei",
  "description": "Huawei uygulaması",
  "type": "web",
  "url": "https://consumer.huawei.com/tr/",
  "executable": "",
  "arguments": "",
  "icon": ""
}
```

| Alan | Açıklama |
|------|----------|
| `appName` | Masaüstünde görünecek uygulama adı |
| `type` | `"web"` (web sitesi) veya `"exe"` (yerel program) |
| `url` | Web modunda açılacak adres |
| `executable` | EXE modunda program yolu (örn. `C:\\Program Files\\Huawei\\HiSuite\\HiSuite.exe`) |
| `arguments` | Programa verilecek ek parametreler |
| `icon` | Özel simge dosyası yolu (isteğe bağlı) |

### 2. Masaüstü kısayolunu oluşturun

#### Windows

PowerShell'i **Yönetici olarak çalıştırmanıza gerek yoktur**. Proje klasöründe şu komutu çalıştırın:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create-shortcut.ps1
```

Alternatif olarak `scripts\launch-app.bat` dosyasını doğrudan çalıştırarak uygulamayı test edebilirsiniz.

#### Linux

```bash
bash scripts/create-shortcut.sh
```

## Nasıl Çalışır?

- **Web modu:** Chrome veya Edge tarayıcısını `--app` modunda açar; site ayrı bir pencerede, tarayıcı çerçevesi olmadan çalışır.
- **EXE modu:** Belirttiğiniz programı doğrudan başlatır.

## Örnek: HiSuite için kısayol

`config.json` dosyasını şu şekilde güncelleyin:

```json
{
  "appName": "HiSuite",
  "description": "Huawei telefon yöneticisi",
  "type": "exe",
  "url": "",
  "executable": "C:\\Program Files (x86)\\HiSuite\\HiSuite.exe",
  "arguments": "",
  "icon": ""
}
```

Ardından Windows'ta `create-shortcut.ps1` betiğini çalıştırın.

## Sorun Giderme

- **"Chrome veya Edge bulunamadı"** → Google Chrome veya Microsoft Edge yükleyin.
- **Kısayol oluştu ama açılmıyor** → `config.json` içindeki `url` veya `executable` yolunu kontrol edin.
- **Linux'ta kısayola tıklayınca güven uyarısı** → Dosyaya sağ tıklayıp "Allow Launching" / "Güven" seçeneğini etkinleştirin.
