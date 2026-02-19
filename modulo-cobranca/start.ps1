# Script para iniciar o Módulo de Cobrança
$host.UI.RawUI.WindowTitle = "Módulo de Cobrança - IAudit"

# Verifica se a porta está em uso
$portInUse = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  A porta 3001 está em uso. Tentando liberar..." -ForegroundColor Yellow
    try {
        Stop-Process -Id $portInUse.OwningProcess -Force
        Start-Sleep -Seconds 2
        Write-Host "✅ Porta liberada!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Não foi possível liberar a porta. Feche manualmente o processo." -ForegroundColor Red
        pause
        exit 1
    }
}

clear

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 INICIANDO SERVIDOR DO MÓDULO DE COBRANÇA         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Porta: 3001" -ForegroundColor White
Write-Host ""
Write-Host "👉 Após iniciar, acesse no navegador:" -ForegroundColor Green
Write-Host "   http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏹️  Para parar, feche esta janela ou pressione Ctrl+C" -ForegroundColor Red
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

node server-test.js

pause
