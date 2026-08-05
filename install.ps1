param(
  [string]$TargetPath = "C:\WiseERPEnterprise"
)

$ErrorActionPreference = "Stop"

Write-Host "Wise One Enterprise - Instalacao da Sprint 0.3.1" -ForegroundColor Cyan
Write-Host "Destino: $TargetPath"

if (-not (Test-Path $TargetPath)) {
  New-Item -ItemType Directory -Path $TargetPath | Out-Null
}

$SourcePath = Split-Path -Parent $MyInvocation.MyCommand.Path

$items = Get-ChildItem -Path $SourcePath -Force | Where-Object {
  $_.Name -notin @("install.ps1", "INSTALL-WINDOWS.md")
}

foreach ($item in $items) {
  $destination = Join-Path $TargetPath $item.Name
  if (Test-Path $destination) {
    Write-Host "Atualizando: $($item.Name)"
    Copy-Item $item.FullName $destination -Recurse -Force
  } else {
    Write-Host "Copiando: $($item.Name)"
    Copy-Item $item.FullName $destination -Recurse
  }
}

$envFile = Join-Path $TargetPath ".env"
$envExample = Join-Path $TargetPath ".env.example"

if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
  Copy-Item $envExample $envFile
  Write-Host "Arquivo .env criado a partir do .env.example" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Projeto instalado em $TargetPath" -ForegroundColor Green
Write-Host "Proximo passo:"
Write-Host "  cd C:\WiseERPEnterprise"
Write-Host "  docker compose up -d postgres redis minio"
