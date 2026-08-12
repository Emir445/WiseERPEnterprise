$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5173'
$api = 'http://localhost:3000/api'
Write-Host '[1/3] Frontend...' -ForegroundColor Cyan
$r = Invoke-WebRequest -Uri $base -UseBasicParsing
if ($r.StatusCode -ne 200 -or $r.Content -notmatch 'Wise One') { throw 'Frontend nao respondeu corretamente.' }
Write-Host '[2/3] Backend...' -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$api/health"
if ($health.status -ne 'ok') { throw 'Backend nao esta saudavel.' }
Write-Host '[3/3] Login API...' -ForegroundColor Cyan
$auth = Invoke-RestMethod -Method POST -Uri "$api/auth/login" -ContentType 'application/json' -Body '{"email":"admin@cerradusgelo.local","password":"WiseERP@123"}'
if (-not $auth.accessToken) { throw 'Login API falhou.' }
Write-Host 'SMOKE FRONTEND + ADMIN V1 CONCLUIDO COM SUCESSO.' -ForegroundColor Green
