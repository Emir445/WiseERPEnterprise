$ErrorActionPreference = "Stop"
Write-Host "[1/3] Instalando dependencias..." -ForegroundColor Cyan
npm install
Write-Host "[2/3] Build Frontend UX V3..." -ForegroundColor Cyan
npm run build
Write-Host "[3/3] Concluido" -ForegroundColor Cyan
Write-Host "LOTE FRONTEND UX V3 CONCLUIDO COM SUCESSO." -ForegroundColor Green
