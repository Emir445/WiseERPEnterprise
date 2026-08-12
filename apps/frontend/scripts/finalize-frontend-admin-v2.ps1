$ErrorActionPreference = 'Stop'
Write-Host '[1/3] Dependencias...' -ForegroundColor Cyan
npm install
Write-Host '[2/3] Build Frontend/Admin V2...' -ForegroundColor Cyan
npm run build
Write-Host '[3/3] Done' -ForegroundColor Cyan
Write-Host 'LOTE FRONTEND + ADMIN V2 CONCLUIDO COM SUCESSO.' -ForegroundColor Green
Write-Host 'Agora execute: npm run dev' -ForegroundColor Yellow
