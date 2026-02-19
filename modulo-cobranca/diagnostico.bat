@echo off
chcp 65001 >nul
echo ==========================================
echo  DIAGNÓSTICO DO MÓDULO DE COBRANÇA
echo ==========================================
echo.

:: Verificar Node.js
echo 🔍 Verificando Node.js...
node --version 2>nul
if errorlevel 1 (
    echo ❌ Node.js NÃO está instalado!
    echo 🌐 Baixe em: https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js encontrado
echo.

:: Verificar pasta node_modules
echo 🔍 Verificando node_modules...
if not exist "node_modules" (
    echo ⚠️  node_modules NÃO encontrado
    echo 📦 Instalando Express...
    call npm install express
    if errorlevel 1 (
        echo ❌ Falha ao instalar
        pause
        exit /b 1
    )
) else (
    echo ✅ node_modules encontrado
)
echo.

:: Verificar porta 3001
echo 🔍 Verificando porta 3001...
netstat -ano | findstr :3001 >nul
if errorlevel 1 (
    echo ✅ Porta 3001 está LIVRE
) else (
    echo ⚠️  Porta 3001 está OCUPADA
    echo 📝 Processos usando a porta:
    netstat -ano | findstr :3001
    echo.
    echo 🔄 Vou tentar usar porta 3002...
    set PORT=3002
)
echo.

:: Testar servidor
echo 🚀 Testando servidor...
echo    Aperte Ctrl+C quando aparecer "Servidor iniciado"
echo    Depois abra: http://localhost:%PORT%
echo.
echo    Pressione qualquer tecla para iniciar...
pause >nul

node server.js
