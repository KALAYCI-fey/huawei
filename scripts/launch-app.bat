@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "CONFIG=%SCRIPT_DIR%..\config.json"

for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-Content '%CONFIG%' | ConvertFrom-Json).type"') do set "APP_TYPE=%%i"
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-Content '%CONFIG%' | ConvertFrom-Json).url"') do set "APP_URL=%%i"
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-Content '%CONFIG%' | ConvertFrom-Json).executable"') do set "APP_EXE=%%i"
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-Content '%CONFIG%' | ConvertFrom-Json).arguments"') do set "APP_ARGS=%%i"

if /i "%APP_TYPE%"=="web" (
    if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
        start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=%APP_URL%
        goto :eof
    )
    if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
        start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=%APP_URL%
        goto :eof
    )
    if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
        start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app=%APP_URL%
        goto :eof
    )
    if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
        start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=%APP_URL%
        goto :eof
    )
    if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
        start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=%APP_URL%
        goto :eof
    )
    echo Chrome veya Edge bulunamadi.
    exit /b 1
) else (
    start "" "%APP_EXE%" %APP_ARGS%
)
