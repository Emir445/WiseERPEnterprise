$ErrorActionPreference = "Stop"
$base = "http://localhost:3000/api"
$suffix = Get-Date -Format "yyyyMMddHHmmss"

function PostJson($uri, $body, $headers) {
  Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -ContentType "application/json" -Body ($body | ConvertTo-Json -Depth 20)
}

Write-Host "=== SMOKE COMERCIAL + FISCAL V3 ===" -ForegroundColor Cyan

$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@cerradusgelo.local","password":"WiseERP@123"}'
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
$me = Invoke-RestMethod -Uri "$base/auth/me" -Headers $headers
$branchId = $me.branch.id

$customers = Invoke-RestMethod -Uri "$base/customers" -Headers $headers
$products = Invoke-RestMethod -Uri "$base/products" -Headers $headers
if (-not $customers.data -or -not $products.data) { throw "É necessário existir ao menos um cliente e um produto." }
$customerId = $customers.data[0].id
$productId = $products.data[0].id

# garante estoque suficiente
$balance = Invoke-RestMethod -Uri "$base/inventory?branchId=$branchId&productId=$productId" -Headers $headers
$current = 0
if ($balance.data) { $current = [decimal]$balance.data[0].quantity }
if ($current -lt 10) {
  PostJson "$base/inventory/adjustment" @{ branchId=$branchId; productId=$productId; quantity=20; notes="Smoke Comercial Fiscal" } $headers | Out-Null
}

$term = PostJson "$base/payment-terms" @{ name="2x Smoke $suffix"; installments=2; firstDueDays=15; intervalDays=30 } $headers
Write-Host "OK condição de pagamento: $($term.name)" -ForegroundColor Green

$quote = PostJson "$base/quotes" @{
  branchId=$branchId; customerId=$customerId; paymentTermId=$term.id; number="ORC-$suffix";
  items=@(@{ productId=$productId; quantity=2; unitPrice=12.50; discountAmount=0 })
} $headers
PostJson "$base/quotes/$($quote.id)/approve" @{} $headers | Out-Null
$order = PostJson "$base/quotes/$($quote.id)/convert/PED-$suffix" @{} $headers
Write-Host "OK orçamento -> pedido: $($order.number)" -ForegroundColor Green

PostJson "$base/sales-orders/$($order.id)/confirm" @{} $headers | Out-Null
$sale = PostJson "$base/sales-orders/$($order.id)/convert/VEN-$suffix" @{} $headers
$confirmedSale = PostJson "$base/sales/$($sale.id)/confirm" @{} $headers
if ($confirmedSale.status -ne 'CONFIRMED') { throw "Venda não foi confirmada." }
Write-Host "OK pedido -> venda confirmada: $($confirmedSale.number)" -ForegroundColor Green

$entries = Invoke-RestMethod -Uri "$base/finance/entries?search=$($sale.id)&limit=20" -Headers $headers
$receivables = @($entries.data | Where-Object { $_.referenceId -eq $sale.id -and $_.type -eq 'RECEIVABLE' })
if ($receivables.Count -ne 2) { throw "Esperadas 2 parcelas financeiras; recebidas $($receivables.Count)." }
Write-Host "OK financeiro parcelado: 2 contas a receber" -ForegroundColor Green

$fiscal = PostJson "$base/fiscal/documents" @{ saleId=$sale.id; type='NFE'; number="NF-$suffix"; series='1'; notes='Documento fiscal interno de smoke test' } $headers
$authorized = PostJson "$base/fiscal/documents/$($fiscal.id)/authorize" @{ accessKey="SMOKE$suffix" } $headers
if ($authorized.status -ne 'AUTHORIZED') { throw "Documento fiscal não foi autorizado internamente." }
Write-Host "OK documento fiscal interno autorizado: $($authorized.number)" -ForegroundColor Green

Write-Host "`nSMOKE COMERCIAL + FISCAL V3 CONCLUIDO COM SUCESSO." -ForegroundColor Green
Write-Host "Observação: autorização fiscal deste lote é interna; não transmite NF-e/NFC-e à SEFAZ." -ForegroundColor Yellow
