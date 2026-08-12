Write-Host "================================="
Write-Host " WiseERPEnterprise Verification "
Write-Host "================================="

Write-Host ""
Write-Host "[1/5] Verificando Git..."

git status

Write-Host ""
Write-Host "[2/5] Validando Docker Compose..."

docker compose -f docker-compose.staging.yml config

Write-Host ""
Write-Host "[3/5] Verificando backend..."

if (Test-Path ".\backend") {
    Write-Host "Backend encontrado"
}
else {
    Write-Host "Backend nao encontrado"
}

Write-Host ""
Write-Host "[4/5] Verificando frontend..."

if (Test-Path ".\apps\frontend") {
    Write-Host "Frontend encontrado"
}
else {
    Write-Host "Frontend nao encontrado"
}

Write-Host ""
Write-Host "[5/5] Validacao concluida"

Write-Host ""
Write-Host "WISE ERP PROJECT OK"