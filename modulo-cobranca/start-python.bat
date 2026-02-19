@echo off
chcp 65001 >nul
echo ==========================================
echo  MÓDULO DE COBRANÇA (Python)
echo ==========================================
echo.

echo 🐍 Verificando Python...
python --version 2>nul
if errorlevel 1 (
    echo ❌ Python nao encontrado!
    echo 🌐 Baixe em: https://python.org
    echo.
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.
echo 🚀 Iniciando servidor...
echo 🌐 Acesse: http://localhost:3001
echo ⏹️  Pressione Ctrl+C para parar
echo.

python server.py

pause
