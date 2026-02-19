@echo off
echo ============================================
echo  CRIANDO ARQUIVO ZIP PARA EMAIL
echo ============================================
echo.

set "DESTINO=%USERPROFILE%\Desktop"

echo Criando ZIP do modulo-cobranca...
powershell -Command "Compress-Archive -Path 'C:\Users\flavi\Downloads\Downloads\IAudit01\Iauditconsultoria\modulo-cobranca\*' -DestinationPath '%DESTINO%\modulo-cobranca.zip' -Force"

if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ ZIP criado com sucesso!
    echo 📁 Local: %DESTINO%\modulo-cobranca.zip
    echo.
    echo Agora voce pode anexar este arquivo no email.
    start %DESTINO%
) else (
    echo.
    echo ❌ Erro ao criar ZIP
)

pause
