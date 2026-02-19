@echo off
echo ============================================
echo  CRIANDO ZIP DO PROJETO COMPLETO
echo ============================================
echo.
echo Isso pode demorar alguns minutos...
echo.

set "DESTINO=%USERPROFILE%\Desktop"
set "ORIGEM=C:\Users\flavi\Downloads\Downloads\IAudit01\Iauditconsultoria"

echo Criando ZIP (excluindo node_modules e .git)...

powershell -Command "
$origem = '%ORIGEM%';
$destino = '%DESTINO%\iaudit-projeto.zip';
$itens = Get-ChildItem -Path $origem -Exclude 'node_modules', '.git', 'dist';
Compress-Archive -Path $itens.FullName -DestinationPath $destino -Force;
"

if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ ZIP criado com sucesso!
    echo 📁 Local: %DESTINO%\iaudit-projeto.zip
    echo.
    start %DESTINO%
) else (
    echo.
    echo ❌ Erro ao criar ZIP
)

pause
