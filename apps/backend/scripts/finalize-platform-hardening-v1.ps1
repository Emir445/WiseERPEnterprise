$ErrorActionPreference="Stop"
Write-Host "[1/3] Prisma validate" -ForegroundColor Cyan; npx prisma validate; if($LASTEXITCODE-ne 0){exit $LASTEXITCODE}
Write-Host "[2/3] Prisma generate" -ForegroundColor Cyan; npx prisma generate; if($LASTEXITCODE-ne 0){Start-Sleep 2;npx prisma generate};if($LASTEXITCODE-ne 0){exit $LASTEXITCODE}
Write-Host "[3/3] Build" -ForegroundColor Cyan; npm run build;if($LASTEXITCODE-ne 0){exit $LASTEXITCODE}
Write-Host "LOTE PLATFORM HARDENING V1 CONCLUIDO COM SUCESSO." -ForegroundColor Green
