$ErrorActionPreference = 'Stop'
Write-Host '[1/3] Instalando dependencias do frontend...' -ForegroundColor Cyan
npm install
Write-Host '[2/3] Validando build...' -ForegroundColor Cyan
npm run build
Write-Host '[3/3] Done' -ForegroundColor Cyan
Write-Host 'LOTE FRONTEND + ADMIN V1 CONCLUIDO COM SUCESSO.' -ForegroundColor Green
Write-Host 'Agora execute: npm run dev' -ForegroundColor Yellow
