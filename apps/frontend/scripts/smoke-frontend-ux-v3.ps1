$ErrorActionPreference = "Stop"
$frontend = "http://localhost:5173"
$backend = "http://localhost:3000/api"
Write-Host "[1/4] Backend health" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$backend/health" -Method GET | Out-Null
Write-Host "[2/4] Frontend" -ForegroundColor Cyan
$r = Invoke-WebRequest -Uri $frontend -UseBasicParsing
if ($r.StatusCode -ne 200) { throw "Frontend indisponivel." }
Write-Host "[3/4] Bundle V3" -ForegroundColor Cyan
if ($r.Content -notmatch "root") { throw "HTML do frontend invalido." }
Write-Host "[4/4] UX primitives compiladas" -ForegroundColor Cyan
$src = Get-Content ".\src\components\Ux.tsx" -Raw
if ($src -notmatch "ToastProvider" -or $src -notmatch "ConfirmDialog" -or $src -notmatch "Pagination") { throw "Primitivas UX V3 ausentes." }
Write-Host "SMOKE FRONTEND UX V3 CONCLUIDO COM SUCESSO." -ForegroundColor Green
