$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '[1/5] Backend...' -ForegroundColor Cyan
Push-Location apps/backend
npm ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci backend falhou.' }
npx prisma validate
if ($LASTEXITCODE -ne 0) { throw 'prisma validate falhou.' }
npx prisma generate
if ($LASTEXITCODE -ne 0) { throw 'prisma generate falhou.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'build backend falhou.' }
Pop-Location

Write-Host '[2/5] Frontend...' -ForegroundColor Cyan
Push-Location apps/frontend
npm ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci frontend falhou.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'build frontend falhou.' }
Pop-Location

Write-Host '[3/5] Workflows...' -ForegroundColor Cyan
$required = @('.github/workflows/ci.yml', '.github/workflows/staging.yml')
foreach ($file in $required) { if (-not (Test-Path $file)) { throw "Arquivo ausente: $file" } }

Write-Host '[4/5] Compose...' -ForegroundColor Cyan
if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker compose version | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'docker compose indisponivel.' }
} else { Write-Host 'Docker nao encontrado; validacao Docker sera feita no GitHub Actions.' -ForegroundColor Yellow }

Write-Host '[5/5] Done' -ForegroundColor Cyan
Write-Host 'LOTE CI/CD V1 CONCLUIDO COM SUCESSO.' -ForegroundColor Green
