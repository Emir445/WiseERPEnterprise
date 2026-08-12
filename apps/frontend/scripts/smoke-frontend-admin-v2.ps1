$ErrorActionPreference = 'Stop'
$front = 'http://localhost:5173'
$api = 'http://localhost:3000/api'
Write-Host '[1/4] Frontend...' -ForegroundColor Cyan
$r = Invoke-WebRequest -Uri $front -UseBasicParsing
if ($r.StatusCode -ne 200 -or $r.Content -notmatch 'Wise One') { throw 'Frontend nao respondeu corretamente.' }
Write-Host '[2/4] Backend...' -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$api/health"
if ($health.status -ne 'ok') { throw 'Backend nao esta saudavel.' }
Write-Host '[3/4] Login...' -ForegroundColor Cyan
$auth = Invoke-RestMethod -Method POST -Uri "$api/auth/login" -ContentType 'application/json' -Body '{"email":"admin@cerradusgelo.local","password":"WiseERP@123"}'
if (-not $auth.accessToken) { throw 'Login API falhou.' }
$h = @{ Authorization = "Bearer $($auth.accessToken)" }
Write-Host '[4/4] Modulos avancados...' -ForegroundColor Cyan
$checks = @(
  @{ Name='Quotes'; Uri="$api/quotes" },
  @{ Name='Treasury'; Uri="$api/treasury/accounts" },
  @{ Name='Procurement'; Uri="$api/procurement/orders" },
  @{ Name='Logistics'; Uri="$api/logistics/shipments" },
  @{ Name='Production'; Uri="$api/production/orders" },
  @{ Name='CRM'; Uri="$api/crm/leads" },
  @{ Name='Services'; Uri="$api/service-orders" },
  @{ Name='Fiscal'; Uri="$api/fiscal/documents" },
  @{ Name='Audit'; Uri="$api/audit-logs?limit=1" }
)
foreach ($check in $checks) {
  try { $null = Invoke-RestMethod -Uri $check.Uri -Headers $h; Write-Host "  OK $($check.Name)" -ForegroundColor DarkGreen }
  catch { throw "Falha no modulo $($check.Name): $($_.Exception.Message)" }
}
Write-Host 'SMOKE FRONTEND + ADMIN V2 CONCLUIDO COM SUCESSO.' -ForegroundColor Green
