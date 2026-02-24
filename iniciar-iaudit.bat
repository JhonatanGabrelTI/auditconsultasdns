@echo off
cd /d "%~dp0"
cls
echo ============================================
echo  INICIANDO SISTEMA IAudit
echo  Porta: 3000
echo ============================================
echo.
echo Acesse: http://localhost:3000
echo.
echo NAO FECHE ESTA JANELA!
echo Pressione Ctrl+C para parar
echo.
echo ============================================
echo.

npm run dev

pause
