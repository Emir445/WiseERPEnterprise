param(
  [string]$BaseUrl = "http://localhost:3000/api",
  [string]$Email = "admin@cerradusgelo.local",
  [string]$Password = "WiseERP@123"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Health ===" -ForegroundColor Cyan
Invoke-RestMethod "$BaseUrl/health" | Format-Table

Write-Host "=== Login ===" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
  email = $Email
  password = $Password
} | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($response.accessToken)" }

$me = Invoke-RestMethod -Uri "$BaseUrl/auth/me" -Headers $headers
$branchId = $me.branch.id

$customers = Invoke-RestMethod -Uri "$BaseUrl/customers?limit=1" -Headers $headers
$products = Invoke-RestMethod -Uri "$BaseUrl/products?limit=1" -Headers $headers
$suppliers = Invoke-RestMethod -Uri "$BaseUrl/suppliers?limit=1" -Headers $headers

if (-not $customers.data -or -not $products.data -or -not $suppliers.data) {
  throw "E necessario existir ao menos 1 cliente, 1 produto e 1 fornecedor para o smoke test."
}

$customerId = $customers.data[0].id
$productId = $products.data[0].id
$supplierId = $suppliers.data[0].id

Write-Host "=== Garantindo estoque ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BaseUrl/inventory/entry" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  branchId = $branchId
  productId = $productId
  quantity = 5
  referenceType = "SMOKE_TEST"
  notes = "Carga automatica para smoke test"
} | ConvertTo-Json) | Out-Null

$suffix = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "=== Venda -> Estoque -> Contas a Receber ===" -ForegroundColor Cyan
$sale = Invoke-RestMethod -Uri "$BaseUrl/sales" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  branchId = $branchId
  customerId = $customerId
  number = "SMOKE-VEN-$suffix"
  items = @(@{
    productId = $productId
    quantity = 1
    unitPrice = 10
    discountAmount = 0
  })
} | ConvertTo-Json -Depth 10)

$confirmedSale = Invoke-RestMethod -Uri "$BaseUrl/sales/$($sale.id)/confirm" -Method POST -Headers $headers
if ($confirmedSale.status -ne "CONFIRMED") { throw "Venda nao foi confirmada." }

$receivables = Invoke-RestMethod -Uri "$BaseUrl/finance/entries?type=RECEIVABLE&search=$($sale.id)" -Headers $headers
if (-not ($receivables.data | Where-Object { $_.referenceId -eq $sale.id })) {
  throw "Conta a receber da venda nao foi encontrada."
}

Write-Host "=== Compra -> Estoque -> Contas a Pagar ===" -ForegroundColor Cyan
$purchase = Invoke-RestMethod -Uri "$BaseUrl/purchases" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  branchId = $branchId
  supplierId = $supplierId
  number = "SMOKE-COMP-$suffix"
  items = @(@{
    productId = $productId
    quantity = 1
    unitCost = 4
  })
} | ConvertTo-Json -Depth 10)

$confirmedPurchase = Invoke-RestMethod -Uri "$BaseUrl/purchases/$($purchase.id)/confirm" -Method POST -Headers $headers
if ($confirmedPurchase.status -ne "CONFIRMED") { throw "Compra nao foi confirmada." }

$payables = Invoke-RestMethod -Uri "$BaseUrl/finance/entries?type=PAYABLE&search=$($purchase.id)" -Headers $headers
if (-not ($payables.data | Where-Object { $_.referenceId -eq $purchase.id })) {
  throw "Conta a pagar da compra nao foi encontrada."
}

Write-Host "=== Resumo Financeiro ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BaseUrl/finance/summary" -Headers $headers | ConvertTo-Json -Depth 10

Write-Host "`nSMOKE TEST CONCLUIDO COM SUCESSO." -ForegroundColor Green
