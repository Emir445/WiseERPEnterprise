$ErrorActionPreference='Stop'
Write-Host '[1/6] Prisma format/validate'
npx prisma format
npx prisma validate
Write-Host '[2/6] Migration'
npx prisma migrate dev --name batch_logistics_commercial_v3
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host '[3/6] Generate'
try { npx prisma generate } catch {}
if($LASTEXITCODE -ne 0){
  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Seconds 2
  npx prisma generate
}
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host '[4/6] Permissions'
npx ts-node prisma/seed-permissions.ts
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host '[5/6] Build'
npm run build
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host '[6/6] Done'
Write-Host 'LOTE LOGISTICA + COMMERCIAL V3 CONCLUIDO COM SUCESSO.' -ForegroundColor Green
