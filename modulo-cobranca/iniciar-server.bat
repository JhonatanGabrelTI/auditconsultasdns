@echo off
cd /d "C:\Users\flavi\Downloads\Downloads\IAudit01\Iauditconsultoria\modulo-cobranca"
cls
echo ============================================
echo  INICIANDO MODULO DE COBRANCA
echo  Porta: 3001
echo ============================================
echo.
echo Acesse: http://localhost:3001
echo.
echo NAO FECHE ESTA JANELA!
echo Pressione Ctrl+C para parar
echo.
echo ============================================
node server-test.js
pause
