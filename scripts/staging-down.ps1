. (Join-Path $PSScriptRoot 'release-common.ps1')
$root = Get-RepoRoot
Assert-Command 'docker'
if (-not (Test-Path (Join-Path $root '.env.staging'))) { throw '.env.staging nao encontrado.' }
Invoke-Compose $root @('down')
Write-Host 'STAGING ENCERRADO COM SUCESSO.' -ForegroundColor Green
