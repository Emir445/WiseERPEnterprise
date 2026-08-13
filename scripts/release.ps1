param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"
$Tag = "v$Version"

Write-Host "=== WiseERPEnterprise Release $Tag ===" -ForegroundColor Cyan

# 1. Branch correta
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    throw "Release deve ser executada somente na branch main. Atual: $currentBranch"
}

# 2. Working tree limpo
$status = git status --porcelain
if ($status) {
    git status
    throw "Existem arquivos modificados. Limpe o working tree antes da release."
}

# 3. Atualizar referencias remotas
Write-Host "[1/5] Atualizando origin..." -ForegroundColor Cyan
git fetch origin
if ($LASTEXITCODE -ne 0) {
    throw "git fetch origin falhou."
}

# 4. Garantir HEAD == origin/main
$local  = (git rev-parse HEAD).Trim()
$remote = (git rev-parse origin/main).Trim()

if ($local -ne $remote) {
    Write-Host "HEAD local : $local" -ForegroundColor Yellow
    Write-Host "origin/main: $remote" -ForegroundColor Yellow
    throw "main local nao esta sincronizada com origin/main. Execute git pull antes da release."
}

# 5. Bloquear tag duplicada
$existingTag = git tag --list $Tag
if ($existingTag) {
    throw "A tag $Tag ja existe."
}

# 6. Validacao do projeto
Write-Host "[2/5] Validando projeto..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File .\scripts\verify-project.ps1
if ($LASTEXITCODE -ne 0) {
    throw "Validacao do projeto falhou."
}

# 7. Criar tag
Write-Host "[3/5] Criando tag $Tag..." -ForegroundColor Cyan
git tag -a $Tag -m "Release $Tag"
if ($LASTEXITCODE -ne 0) {
    throw "Criacao da tag falhou."
}

# 8. Enviar tag
Write-Host "[4/5] Enviando tag..." -ForegroundColor Cyan
git push origin $Tag
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push falhou. Removendo tag local para evitar estado inconsistente..." -ForegroundColor Yellow
    git tag -d $Tag | Out-Null
    throw "Push da tag falhou."
}

Write-Host "[5/5] RELEASE $Tag PUBLICADA COM SUCESSO." -ForegroundColor Green
Write-Host "GitHub Actions criara a release automaticamente." -ForegroundColor Green
