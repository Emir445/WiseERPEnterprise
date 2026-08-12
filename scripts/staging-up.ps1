. (Join-Path $PSScriptRoot 'release-common.ps1')
$root = Get-RepoRoot
Assert-Command 'docker'
Assert-StagingEnv $root | Out-Null

$port = '8080'
$portLine = Get-Content (Join-Path $root '.env.staging') | Where-Object { $_ -match '^STAGING_HTTP_PORT=' } | Select-Object -First 1
if ($portLine) { $port = ($portLine -split '=', 2)[1].Trim() }

Write-Host 'Construindo e iniciando staging...'
Invoke-Compose $root @('up', '-d', '--build', '--remove-orphans')

Write-Host 'Aguardando readiness...'
$deadline = (Get-Date).AddMinutes(5)
$ready = $false
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 5
  try {
    $health = Invoke-RestMethod -Uri ("http://localhost:{0}/api/health/ready" -f $port) -TimeoutSec 5
    if ($health.status -eq 'ready') { $ready = $true; break }
  } catch { }
}

if (-not $ready) {
  Invoke-Compose $root @('ps')
  throw 'Timeout aguardando staging ficar pronto.'
}

Invoke-Compose $root @('ps')
Write-Host ("STAGING INICIADO COM SUCESSO: http://localhost:{0}" -f $port) -ForegroundColor Green
