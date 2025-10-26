# Smart Trolley - Sistema Completo para Windows
# Ejecuta los 3 servicios en terminales separadas

Write-Host "🚀 Smart Trolley - Sistema Completo" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Verificar archivos .env
if (-not (Test-Path "apps\api\.env")) {
    Write-Host "⚠️  Falta apps\api\.env - Créalo con DATABASE_URL y GEMINI_API_KEY" -ForegroundColor Yellow
    Read-Host "Presiona Enter para continuar"
    exit 1
}

if (-not (Test-Path "apps\web-camera\.env")) {
    Write-Host "⚠️  Falta apps\web-camera\.env - Créalo con VITE_WS_URL=ws://localhost:3001" -ForegroundColor Yellow
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green
Write-Host ""

# Matar procesos anteriores
Write-Host "🔄 Limpiando procesos anteriores..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Función para abrir nueva terminal
function Start-Service {
    param(
        [string]$Title,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "🔧 Iniciando $Title..." -ForegroundColor Blue
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; $Command"
    Start-Sleep -Seconds 2
}

# Iniciar servicios
Start-Service -Title "Backend API (puerto 3001)" -Path "$PWD\apps\api" -Command "npm run dev"
Start-Service -Title "Web Camera App (puerto 3002)" -Path "$PWD\apps\web-camera" -Command "npm run dev"
Start-Service -Title "Dashboard (puerto 3000)" -Path "$PWD\apps\dashboard" -Command "npm run dev"

Write-Host ""
Write-Host "✅ Sistema iniciado" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "Backend API:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Web Camera:   http://localhost:3002" -ForegroundColor Cyan
Write-Host "Dashboard:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "🎬 SIGUIENTE: Abre http://localhost:3002/ y haz clic en Iniciar" -ForegroundColor Yellow
Write-Host "🛑 Para detener: Cierra las ventanas de terminal o usa Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para salir"

