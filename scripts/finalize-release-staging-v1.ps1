$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

Write-Host '[1/6] Validando ferramentas...'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js nao encontrado.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'npm nao encontrado.' }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker nao encontrado.' }

Write-Host '[2/6] Backend dependencies/build...'
Push-Location (Join-Path $root 'apps/backend')
npm ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci backend falhou.' }
npx prisma validate
if ($LASTEXITCODE -ne 0) {
    throw "prisma validate backend falhou."
}

Write-Host "[Backend] Gerando Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    throw "prisma generate backend falhou."
}
if ($LASTEXITCODE -ne 0) { throw 'prisma validate falhou.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'build backend falhou.' }
Pop-Location

Write-Host '[3/6] Frontend dependencies/build...'
Push-Location (Join-Path $root 'apps/frontend')
npm ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci frontend falhou.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'build frontend falhou.' }
Pop-Location

Write-Host '[4/6] Validando compose...'
if (-not (Test-Path (Join-Path $root '.env.staging'))) {
  Copy-Item (Join-Path $root '.env.staging.example') (Join-Path $root '.env.staging')
  Write-Host 'Arquivo .env.staging criado a partir do exemplo.' -ForegroundColor Yellow
  Write-Host 'Configure os valores CHANGE_ME antes de executar staging-up.ps1.' -ForegroundColor Yellow
}
& docker compose --env-file (Join-Path $root '.env.staging') -f (Join-Path $root 'docker-compose.staging.yml') config --quiet
if ($LASTEXITCODE -ne 0) { throw 'docker compose config falhou.' }

Write-Host '[5/6] Validando arquivos de release...'
$required = @(
  'docker-compose.staging.yml',
  'apps/backend/Dockerfile.staging',
  'apps/frontend/Dockerfile.staging',
  'apps/frontend/nginx.staging.conf',
  'scripts/staging-up.ps1',
  'scripts/staging-down.ps1',
  'scripts/staging-health.ps1',
  'scripts/smoke-staging-v1.ps1'
)
foreach ($file in $required) {
  if (-not (Test-Path (Join-Path $root $file))) { throw "Arquivo ausente: $file" }
}

Write-Host '[6/6] Done'
Write-Host 'LOTE RELEASE + STAGING V1 CONCLUIDO COM SUCESSO.' -ForegroundColor Green

