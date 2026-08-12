$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $root '.env.staging'
if (-not (Test-Path $envFile)) { throw '.env.staging nao encontrado.' }

$values = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -and -not $_.Trim().StartsWith('#') -and $_ -match '=') {
    $parts = $_ -split '=', 2
    $values[$parts[0].Trim()] = $parts[1].Trim()
  }
}
$port = if ($values.ContainsKey('STAGING_HTTP_PORT')) { $values['STAGING_HTTP_PORT'] } else { '8080' }
$base = "http://localhost:$port"

Write-Host '[1/5] Frontend...'
$r = Invoke-WebRequest -Uri "$base/" -UseBasicParsing -TimeoutSec 10
if ($r.StatusCode -ne 200) { throw 'Frontend nao respondeu 200.' }

Write-Host '[2/5] API health...'
$health = Invoke-RestMethod -Uri "$base/api/health" -TimeoutSec 10
if ($health.status -ne 'ok') { throw 'Health invalido.' }

Write-Host '[3/5] API readiness...'
$ready = Invoke-RestMethod -Uri "$base/api/health/ready" -TimeoutSec 10
if ($ready.status -ne 'ready') { throw 'Readiness invalido.' }

Write-Host '[4/5] Request id / headers...'
$resp = Invoke-WebRequest -Uri "$base/api/health" -UseBasicParsing -TimeoutSec 10
if (-not $resp.Headers['x-request-id']) { throw 'x-request-id ausente.' }

Write-Host '[5/5] Login opcional...'
$email = $values['STAGING_SMOKE_EMAIL']
$password = $values['STAGING_SMOKE_PASSWORD']
if ($email -and $password -and $password -notmatch 'CHANGE_ME') {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 10
  if (-not $login.accessToken) { throw 'Login staging nao retornou accessToken.' }
  Write-Host 'Login autenticado OK.'
} else {
  Write-Host 'Login ignorado: STAGING_SMOKE_EMAIL/PASSWORD nao configurados.' -ForegroundColor Yellow
}

Write-Host 'SMOKE RELEASE + STAGING V1 CONCLUIDO COM SUCESSO.' -ForegroundColor Green
