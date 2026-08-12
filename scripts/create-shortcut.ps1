# Huawei masaüstü kısayolu oluşturucu (Windows)
# Kullanım: PowerShell -ExecutionPolicy Bypass -File create-shortcut.ps1

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path (Split-Path -Parent $scriptDir) "config.json"

if (-not (Test-Path $configPath)) {
    Write-Error "config.json bulunamadı: $configPath"
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
$appName = $config.appName
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "$appName.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)

if ($config.type -eq "web") {
    $url = $config.url
    $chromePaths = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
    )
    $edgePaths = @(
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
    )

    $browser = $null
    foreach ($path in ($chromePaths + $edgePaths)) {
        if (Test-Path $path) {
            $browser = $path
            break
        }
    }

    if (-not $browser) {
        Write-Error "Chrome veya Edge bulunamadı. Lütfen bir tarayıcı yükleyin."
    }

    $shortcut.TargetPath = $browser
    $shortcut.Arguments = "--app=$url"
} else {
    if (-not $config.executable -or -not (Test-Path $config.executable)) {
        Write-Error "Geçerli bir executable yolu belirtin: config.json -> executable"
    }
    $shortcut.TargetPath = $config.executable
    if ($config.arguments) {
        $shortcut.Arguments = $config.arguments
    }
}

$shortcut.WorkingDirectory = Split-Path $shortcut.TargetPath -Parent
$shortcut.Description = $config.description

if ($config.icon -and (Test-Path $config.icon)) {
    $shortcut.IconLocation = $config.icon
}

$shortcut.Save()

Write-Host "Masaüstü kısayolu oluşturuldu: $shortcutPath" -ForegroundColor Green
Write-Host "Uygulamayı açmak için masaüstündeki '$appName' simgesine çift tıklayın."
