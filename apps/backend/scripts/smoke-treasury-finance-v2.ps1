$ErrorActionPreference = "Stop"
$base = "http://localhost:3000/api"
$suffix = Get-Date -Format "yyyyMMddHHmmss"

function PostJson($uri, $body, $headers) {
  Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -ContentType "application/json" -Body ($body | ConvertTo-Json -Depth 20)
}

Write-Host "=== SMOKE TESOURARIA + FINANCEIRO V2 ===" -ForegroundColor Cyan

$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@cerradusgelo.local","password":"WiseERP@123"}'
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
$me = Invoke-RestMethod -Uri "$base/auth/me" -Headers $headers
$branchId = $me.branch.id

$revenue = PostJson "$base/chart-accounts" @{ code="3.$suffix"; name="Receita Smoke $suffix"; nature='REVENUE' } $headers
$expense = PostJson "$base/chart-accounts" @{ code="4.$suffix"; name="Despesa Smoke $suffix"; nature='EXPENSE' } $headers
$cost = PostJson "$base/cost-centers" @{ code="CC-$suffix"; name="Centro Smoke $suffix" } $headers
Write-Host "OK plano de contas e centro de custo" -ForegroundColor Green

$bank = PostJson "$base/treasury/accounts" @{
  name="Banco Smoke $suffix"; type='BANK'; branchId=$branchId; bankName='Banco Teste'; openingBalance=500; allowNegative=$false
} $headers
$cash = PostJson "$base/treasury/accounts" @{
  name="Caixa Smoke $suffix"; type='CASH'; branchId=$branchId; openingBalance=100; allowNegative=$false
} $headers
Write-Host "OK contas de tesouraria" -ForegroundColor Green

$receivable = PostJson "$base/finance/entries" @{
  branchId=$branchId; type='RECEIVABLE'; description="Receita manual smoke $suffix"; amount=75; dueDate=(Get-Date).AddDays(5).ToString('yyyy-MM-dd'); chartAccountId=$revenue.id; costCenterId=$cost.id
} $headers
$payable = PostJson "$base/finance/entries" @{
  branchId=$branchId; type='PAYABLE'; description="Despesa manual smoke $suffix"; amount=50; dueDate=(Get-Date).AddDays(2).ToString('yyyy-MM-dd'); chartAccountId=$expense.id; costCenterId=$cost.id
} $headers
Write-Host "OK lançamentos financeiros manuais" -ForegroundColor Green

$paidReceivable = PostJson "$base/finance/entries/$($receivable.id)/settle" @{
  amount=75; paymentMethod='PIX'; treasuryAccountId=$cash.id; chartAccountId=$revenue.id; costCenterId=$cost.id; notes='Smoke recebimento'
} $headers
$paidPayable = PostJson "$base/finance/entries/$($payable.id)/settle" @{
  amount=50; paymentMethod='BANK_TRANSFER'; treasuryAccountId=$bank.id; chartAccountId=$expense.id; costCenterId=$cost.id; notes='Smoke pagamento'
} $headers
if ($paidReceivable.status -ne 'PAID' -or $paidPayable.status -ne 'PAID') { throw 'Baixas financeiras não foram concluídas.' }
Write-Host "OK baixas integradas à tesouraria" -ForegroundColor Green

$transfer = PostJson "$base/treasury/transfers" @{ fromAccountId=$cash.id; toAccountId=$bank.id; amount=25; notes='Smoke transferência' } $headers
if (-not $transfer.id) { throw 'Transferência não criada.' }
Write-Host "OK transferência entre contas" -ForegroundColor Green

$movements = Invoke-RestMethod -Uri "$base/treasury/movements?limit=200" -Headers $headers
$ourMovements = @($movements.data | Where-Object { $_.treasuryAccountId -eq $bank.id -or $_.treasuryAccountId -eq $cash.id })
if ($ourMovements.Count -lt 6) { throw "Movimentações esperadas não encontradas. Recebidas: $($ourMovements.Count)" }
$ids = @($ourMovements | Select-Object -First 2 -ExpandProperty id)
$reconciled = PostJson "$base/treasury/movements/reconcile" @{ movementIds=$ids; reference="SMOKE-$suffix" } $headers
if ($reconciled.reconciled -ne 2) { throw 'Conciliação não confirmou duas movimentações.' }
Write-Host "OK conciliação bancária simplificada" -ForegroundColor Green

$session = PostJson "$base/treasury/cash-sessions/open" @{ branchId=$branchId; treasuryAccountId=$cash.id; openingAmount=100; notes='Abertura smoke' } $headers
$cashNow = (Invoke-RestMethod -Uri "$base/treasury/accounts/$($cash.id)" -Headers $headers).currentBalance
$closed = PostJson "$base/treasury/cash-sessions/$($session.id)/close" @{ actualClosingAmount=[decimal]$cashNow; notes='Fechamento smoke' } $headers
if ($closed.status -ne 'CLOSED') { throw 'Sessão de caixa não foi fechada.' }
Write-Host "OK abertura e fechamento de caixa" -ForegroundColor Green

$flow = Invoke-RestMethod -Uri "$base/treasury/cash-flow" -Headers $headers
if ($null -eq $flow.net) { throw 'Fluxo de caixa não retornou resumo.' }
$summary = Invoke-RestMethod -Uri "$base/finance/summary" -Headers $headers
if ($null -eq $summary.treasury) { throw 'Resumo financeiro não retornou tesouraria.' }
Write-Host "OK fluxo de caixa e resumo financeiro" -ForegroundColor Green

Write-Host "`nSMOKE TESOURARIA + FINANCEIRO V2 CONCLUIDO COM SUCESSO." -ForegroundColor Green
