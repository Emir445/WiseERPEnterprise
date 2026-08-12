$ErrorActionPreference='Stop'
Write-Host '[1/6] Prisma format/validate' -ForegroundColor Cyan
npx prisma format; if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}; npx prisma validate; if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host '[2/6] Migration' -ForegroundColor Cyan
npx prisma migrate dev --name batch_production_pcp_v1; if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host '[3/6] Generate' -ForegroundColor Cyan
npx prisma generate; if($LASTEXITCODE -ne 0){ Start-Sleep -Seconds 2; npx prisma generate; if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}}
Write-Host '[4/6] Permissions' -ForegroundColor Cyan
npx ts-node prisma/seed-permissions.ts; if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host '[5/6] Build' -ForegroundColor Cyan
npm run build; if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host '[6/6] Done' -ForegroundColor Cyan
Write-Host 'LOTE PRODUCAO + PCP V1 CONCLUIDO COM SUCESSO.' -ForegroundColor Green
