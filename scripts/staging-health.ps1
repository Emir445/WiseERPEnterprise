. (Join-Path $PSScriptRoot 'release-common.ps1')
$root = Get-RepoRoot
Assert-Command 'docker'
Assert-StagingEnv $root | Out-Null

$port = '8080'
$line = Get-Content (Join-Path $root '.env.staging') | Where-Object { $_ -match '^STAGING_HTTP_PORT=' } | Select-Object -First 1
if ($line) { $port = ($line -split '=', 2)[1].Trim() }

Invoke-Compose $root @('ps')
Write-Host ''
$health = Invoke-RestMethod -Uri ("http://localhost:{0}/api/health" -f $port) -TimeoutSec 10
$ready = Invoke-RestMethod -Uri ("http://localhost:{0}/api/health/ready" -f $port) -TimeoutSec 10
$front = Invoke-WebRequest -Uri ("http://localhost:{0}/" -f $port) -UseBasicParsing -TimeoutSec 10

$health | ConvertTo-Json -Depth 5
$ready | ConvertTo-Json -Depth 5
Write-Host ("Frontend HTTP: {0}" -f $front.StatusCode)
Write-Host 'STAGING HEALTH OK.' -ForegroundColor Green
