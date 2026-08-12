#!/usr/bin/env bash
# Huawei masaüstü kısayolu oluşturucu (Linux)
# Kullanım: bash scripts/create-shortcut.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="$SCRIPT_DIR/../config.json"

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Hata: config.json bulunamadı: $CONFIG_PATH" >&2
  exit 1
fi

APP_NAME=$(python3 -c "import json; print(json.load(open('$CONFIG_PATH'))['appName'])")
DESCRIPTION=$(python3 -c "import json; print(json.load(open('$CONFIG_PATH'))['description'])")
APP_TYPE=$(python3 -c "import json; print(json.load(open('$CONFIG_PATH'))['type'])")

DESKTOP_DIR="${XDG_DESKTOP_DIR:-$HOME/Desktop}"
if [[ ! -d "$DESKTOP_DIR" ]]; then
  DESKTOP_DIR="$HOME/Masaüstü"
fi
mkdir -p "$DESKTOP_DIR"

DESKTOP_FILE="$DESKTOP_DIR/${APP_NAME}.desktop"
LAUNCHER_SCRIPT="$SCRIPT_DIR/launch-app.sh"

cat > "$LAUNCHER_SCRIPT" << 'LAUNCHER_EOF'
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="$SCRIPT_DIR/../config.json"

APP_TYPE=$(python3 -c "import json; print(json.load(open('$CONFIG_PATH'))['type'])")

if [[ "$APP_TYPE" == "web" ]]; then
  URL=$(python3 -c "import json; print(json.load(open('$CONFIG_PATH'))['url'])")
  for browser in google-chrome chromium chromium-browser microsoft-edge brave-browser; do
    if command -v "$browser" &>/dev/null; then
      exec "$browser" --app="$URL"
    fi
  done
  echo "Chrome, Chromium veya Edge bulunamadı." >&2
  exit 1
else
  EXECUTABLE=$(python3 -c "import json; print(json.load(open('$CONFIG_PATH'))['executable'])")
  ARGS=$(python3 -c "import json; c=json.load(open('$CONFIG_PATH')); print(c.get('arguments',''))")
  exec "$EXECUTABLE" $ARGS
fi
LAUNCHER_EOF

chmod +x "$LAUNCHER_SCRIPT"

ICON_LINE=""
ICON=$(python3 -c "import json; print(json.load(open('$CONFIG_PATH')).get('icon',''))")
if [[ -n "$ICON" && -f "$ICON" ]]; then
  ICON_LINE="Icon=$ICON"
fi

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=$APP_NAME
Comment=$DESCRIPTION
Exec=$LAUNCHER_SCRIPT
Terminal=false
Categories=Utility;
StartupNotify=true
$ICON_LINE
EOF

chmod +x "$DESKTOP_FILE"

if command -v gio &>/dev/null; then
  gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true
fi

echo "Masaüstü kısayolu oluşturuldu: $DESKTOP_FILE"
echo "Uygulamayı açmak için masaüstündeki '$APP_NAME' simgesine çift tıklayın."
