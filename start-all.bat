@echo off
echo 🚀 Smart Trolley - Sistema Completo
echo ====================================
echo.

REM Verificar que existan los archivos .env
if not exist "apps\api\.env" (
    echo ⚠️  Falta apps\api\.env - Créalo con DATABASE_URL y GEMINI_API_KEY
    pause
    exit /b 1
)

if not exist "apps\web-camera\.env" (
    echo ⚠️  Falta apps\web-camera\.env - Créalo con VITE_WS_URL=ws://localhost:3001
    pause
    exit /b 1
)

echo ✅ Variables de entorno configuradas
echo.

REM Matar procesos anteriores
taskkill /f /im node.exe 2>nul
taskkill /f /im nodemon.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🔧 Iniciando Backend API (puerto 3001)...
start "Backend API" cmd /k "cd /d apps\api && npm run dev"

timeout /t 3 /nobreak >nul

echo 🌐 Iniciando Web Camera App (puerto 3002)...
start "Web Camera" cmd /k "cd /d apps\web-camera && npm run dev"

timeout /t 2 /nobreak >nul

echo 📊 Iniciando Dashboard (puerto 3000)...
start "Dashboard" cmd /k "cd /d apps\dashboard && npm run dev"

echo.
echo ✅ Sistema iniciado
echo ====================================
echo Backend API:  http://localhost:3001
echo Web Camera:   http://localhost:3002
echo Dashboard:    http://localhost:3000
echo ====================================
echo.
echo 🎬 SIGUIENTE: Abre http://localhost:3002/ y haz clic en Iniciar
echo 🛑 Para detener: Cierra las ventanas de terminal o usa Ctrl+C
echo.
pause

