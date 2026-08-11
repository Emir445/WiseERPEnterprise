param(
  [string]$MigrationName = "batch_sales_finance_cleanup"
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
  param([string]$Title, [scriptblock]$Action)
  Write-Host "`n=== $Title ===" -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
    throw "Falha em: $Title (exit code $LASTEXITCODE)"
  }
}

$backend = Split-Path -Parent $PSScriptRoot
$root = Split-Path -Parent (Split-Path -Parent $backend)
Set-Location $backend

Write-Host "WiseERPEnterprise - finalizacao automatica do lote Sales + Finance" -ForegroundColor Green
Write-Host "Backend: $backend"

# Evita o EPERM do Prisma Client encerrando apenas processos Node ligados a este projeto.
Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*$root*" } |
  ForEach-Object {
    Write-Host "Encerrando Node do projeto (PID $($_.ProcessId))..."
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }

Set-Location $root
try {
  docker info *> $null
} catch {
  Write-Host "Iniciando Docker Desktop..." -ForegroundColor Yellow
  docker desktop start | Out-Host
  Start-Sleep -Seconds 15
}

Invoke-Step "Subindo PostgreSQL" { docker compose up -d postgres }
Set-Location $backend

Invoke-Step "Prisma format" { npx prisma format }
Invoke-Step "Prisma validate" { npx prisma validate }
Invoke-Step "Criando/aplicando migration" { npx prisma migrate dev --name $MigrationName }
Invoke-Step "Gerando Prisma Client" { npx prisma generate }
Invoke-Step "Atualizando permissoes do Administrador" { npx ts-node prisma\seed-permissions.ts }
Invoke-Step "Build NestJS" { npm run build }

Write-Host "`nLOTE CONCLUIDO COM SUCESSO." -ForegroundColor Green
Write-Host "Agora execute: npm run start:dev"
