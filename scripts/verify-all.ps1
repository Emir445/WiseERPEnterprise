$ErrorActionPreference = "Stop"

Write-Host "=================================" -ForegroundColor Cyan
Write-Host " WiseERPEnterprise Verification " -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$requiredPaths = @(
    ".\apps\backend",
    ".\apps\frontend",
    ".\apps\backend\prisma\schema.prisma",
    ".\docker-compose.staging.yml",
    ".\.github\workflows\ci.yml"
)

Write-Host "`n[1/3] Validando estrutura obrigatoria..."
foreach ($path in $requiredPaths) {
    if (-not (Test-Path $path)) {
        throw "Caminho obrigatorio nao encontrado: $path"
    }
}
Write-Host "Estrutura obrigatoria OK" -ForegroundColor Green

Write-Host "`n[2/3] Executando verificacao completa do projeto..."
powershell -ExecutionPolicy Bypass -File .\scripts\verify-project.ps1
if ($LASTEXITCODE -ne 0) {
    throw "verify-project.ps1 falhou com codigo $LASTEXITCODE"
}

Write-Host "`n[3/3] Validacao concluida"
Write-Host "WISE ERP PROJECT OK" -ForegroundColor Green
