$ErrorActionPreference = "Stop"

$backend = Split-Path -Parent $PSScriptRoot
Set-Location $backend

Write-Host "=== Wise ERP - Tesouraria + Financeiro V2 ===" -ForegroundColor Cyan

try {
  $dockerStatus = docker desktop status 2>$null | Out-String
  if ($dockerStatus -notmatch "running") {
    Write-Host "Iniciando Docker Desktop..." -ForegroundColor Yellow
    docker desktop start | Out-Null
    Start-Sleep -Seconds 15
  }
} catch {
  Write-Host "Docker Desktop CLI não disponível; seguindo com o ambiente atual." -ForegroundColor Yellow
}

$repoRoot = Resolve-Path (Join-Path $backend "..\..")
try {
  Set-Location $repoRoot
  docker compose up -d postgres | Out-Host
} catch {
  Write-Host "Não foi possível iniciar PostgreSQL via Docker Compose. Verifique se o banco já está ativo." -ForegroundColor Yellow
}
Set-Location $backend

Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*WiseERPEnterprise*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

Write-Host "`n[1/6] Formatando Prisma..." -ForegroundColor Cyan
npx prisma format
if ($LASTEXITCODE -ne 0) { throw "prisma format falhou" }

Write-Host "`n[2/6] Validando schema..." -ForegroundColor Cyan
npx prisma validate
if ($LASTEXITCODE -ne 0) { throw "prisma validate falhou" }

Write-Host "`n[3/6] Criando/aplicando migration Tesouraria + Financeiro V2..." -ForegroundColor Cyan
npx prisma migrate dev --name batch_treasury_finance_v2 --skip-generate
if ($LASTEXITCODE -ne 0) { throw "prisma migrate dev falhou" }

Write-Host "`n[4/6] Gerando Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "prisma generate falhou" }

Write-Host "`n[5/6] Atualizando permissões..." -ForegroundColor Cyan
npx ts-node prisma\seed-permissions.ts
if ($LASTEXITCODE -ne 0) { throw "seed de permissões falhou" }

Write-Host "`n[6/6] Compilando backend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "build falhou" }

Write-Host "`nLOTE TESOURARIA + FINANCEIRO V2 CONCLUIDO COM SUCESSO." -ForegroundColor Green
Write-Host "Agora execute: npm run start:dev" -ForegroundColor Green
