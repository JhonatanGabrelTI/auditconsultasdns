@echo off
chcp 65001 >nul
echo ==========================================
echo  MÓDULO DE COBRANÇA - BRADESCO
echo ==========================================
echo.

:: Verificar se node_modules existe
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    echo Isso pode levar alguns minutos...
    call npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas!
    echo.
)

:: Verificar se .env existe
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado
    echo 📝 Criando .env padrão...
    copy .env.example .env
    echo ✅ Arquivo .env criado
    echo 📝 Edite o arquivo .env com suas credenciais
    echo.
)

echo 🚀 Iniciando servidor...
echo 🌐 Acesse: http://localhost:3001
echo ⏹️  Pressione Ctrl+C para parar
echo.

npm run server

pause
