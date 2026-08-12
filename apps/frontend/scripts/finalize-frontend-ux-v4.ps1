$ErrorActionPreference = "Stop"
Write-Host "[1/3] Instalando dependencias..." -ForegroundColor Cyan
npm install
Write-Host "[2/3] Build TypeScript/Vite..." -ForegroundColor Cyan
npm run build
Write-Host "[3/3] Validacao de arquivos..." -ForegroundColor Cyan
if (!(Test-Path ".\src\pages\OperationsPage.tsx")) { throw "OperationsPage.tsx ausente" }
Write-Host "LOTE FRONTEND UX V4 CONCLUIDO COM SUCESSO." -ForegroundColor Green
