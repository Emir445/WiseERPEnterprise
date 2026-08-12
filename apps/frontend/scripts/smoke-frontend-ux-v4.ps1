$ErrorActionPreference = "Stop"
$backend = "http://localhost:3000/api"
$frontend = "http://localhost:5173"
Write-Host "[1/4] Backend health" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$backend/health" -Method GET | Out-Null
Write-Host "[2/4] Frontend" -ForegroundColor Cyan
$r = Invoke-WebRequest -Uri $frontend -UseBasicParsing
if ($r.StatusCode -ne 200) { throw "Frontend HTTP $($r.StatusCode)" }
Write-Host "[3/4] Assets UX V4" -ForegroundColor Cyan
$source = Get-Content ".\src\pages\OperationsPage.tsx" -Raw
if ($source -notmatch "Exportar CSV" -or $source -notmatch "Registrar baixa" -or $source -notmatch "Total do documento") { throw "Recursos UX V4 ausentes" }
Write-Host "[4/4] Build" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "ERRO: build do frontend falhou." -ForegroundColor Red
  exit 1
}
Write-Host "SMOKE FRONTEND UX V4 CONCLUIDO COM SUCESSO." -ForegroundColor Green

