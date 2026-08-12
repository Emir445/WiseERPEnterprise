Write-Host "=== WiseERPEnterprise Project Verification ===" -ForegroundColor Cyan

Write-Host "`n[1/6] Git status..."
git status --short

Write-Host "`n[2/6] Backend Prisma validate..."
Push-Location apps/backend
npx prisma validate
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    exit 1
}

Write-Host "`n[3/6] Backend build..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    exit 1
}
Pop-Location

Write-Host "`n[4/6] Frontend build..."
Push-Location apps/frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    exit 1
}
Pop-Location

Write-Host "`n[5/6] Docker staging validation..."
docker compose -f docker-compose.staging.yml config --quiet
if ($LASTEXITCODE -ne 0) {
    exit 1
}

Write-Host "`n[6/6] Completed successfully"
Write-Host "WISE ERP PROJECT OK" -ForegroundColor Green
