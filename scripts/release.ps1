param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$Tag = "v$Version"

Write-Host "=== WiseERPEnterprise Release $Tag ==="

Write-Host "Verificando Git..."

$status = git status --porcelain

if ($status) {
    Write-Host "ERRO: existem arquivos modificados."
    git status
    exit 1
}

Write-Host "Executando validação..."

if (Test-Path ".\scripts\verify-project.ps1") {
    powershell -ExecutionPolicy Bypass -File .\scripts\verify-project.ps1
}

Write-Host "Criando tag $Tag..."

git tag -a $Tag -m "Release $Tag"

Write-Host "Enviando tag..."

git push origin $Tag

Write-Host ""
Write-Host "Release enviado com sucesso!"
Write-Host "GitHub Actions irá criar a release automaticamente."
