param(
  [string]$BaseUrl = "http://localhost:3000/api",
  [string]$Email = "admin@cerradusgelo.local",
  [string]$Password = "WiseERP@123"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Health / Login ===" -ForegroundColor Cyan
Invoke-RestMethod "$BaseUrl/health" | Out-Null
$response = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
  email = $Email
  password = $Password
} | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($response.accessToken)" }

$me = Invoke-RestMethod -Uri "$BaseUrl/auth/me" -Headers $headers
$mainBranchId = $me.branch.id

$products = Invoke-RestMethod -Uri "$BaseUrl/products?limit=1" -Headers $headers
$customers = Invoke-RestMethod -Uri "$BaseUrl/customers?limit=1" -Headers $headers
$suppliers = Invoke-RestMethod -Uri "$BaseUrl/suppliers?limit=1" -Headers $headers
if (-not $products.data -or -not $customers.data -or -not $suppliers.data) {
  throw "E necessario existir ao menos 1 produto, 1 cliente e 1 fornecedor."
}

$productId = $products.data[0].id
$customerId = $customers.data[0].id
$supplierId = $suppliers.data[0].id
$suffix = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "=== Categoria de Produto ===" -ForegroundColor Cyan
$category = Invoke-RestMethod -Uri "$BaseUrl/product-categories" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  name = "Smoke Categoria $suffix"
  description = "Criada pelo smoke test"
} | ConvertTo-Json)
Invoke-RestMethod -Uri "$BaseUrl/products/$productId" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{
  categoryId = $category.id
} | ConvertTo-Json) | Out-Null

Write-Host "=== Segunda Filial ===" -ForegroundColor Cyan
$branch = Invoke-RestMethod -Uri "$BaseUrl/branches" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  name = "Smoke Filial $suffix"
  code = "SMK-$suffix"
} | ConvertTo-Json)

Write-Host "=== Garantindo saldo na Matriz ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BaseUrl/inventory/entry" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  branchId = $mainBranchId
  productId = $productId
  quantity = 10
  referenceType = "SMOKE_OPERATIONS"
  notes = "Carga para transferencia"
} | ConvertTo-Json) | Out-Null

Write-Host "=== Transferencia entre Filiais ===" -ForegroundColor Cyan
$transfer = Invoke-RestMethod -Uri "$BaseUrl/inventory/transfers" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  number = "SMK-TRF-$suffix"
  fromBranchId = $mainBranchId
  toBranchId = $branch.id
  items = @(@{
    productId = $productId
    quantity = 2
  })
} | ConvertTo-Json -Depth 10)
if ($transfer.status -ne "CONFIRMED") { throw "Transferencia nao foi confirmada." }

$cancelledTransfer = Invoke-RestMethod -Uri "$BaseUrl/inventory/transfers/$($transfer.id)/cancel" -Method POST -Headers $headers
if ($cancelledTransfer.status -ne "CANCELLED") { throw "Transferencia nao foi cancelada." }

Write-Host "=== Venda Confirmada -> Estorno ===" -ForegroundColor Cyan
$sale = Invoke-RestMethod -Uri "$BaseUrl/sales" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  branchId = $mainBranchId
  customerId = $customerId
  number = "SMK-REV-VEN-$suffix"
  items = @(@{
    productId = $productId
    quantity = 1
    unitPrice = 10
    discountAmount = 0
  })
} | ConvertTo-Json -Depth 10)
Invoke-RestMethod -Uri "$BaseUrl/sales/$($sale.id)/confirm" -Method POST -Headers $headers | Out-Null
$cancelledSale = Invoke-RestMethod -Uri "$BaseUrl/sales/$($sale.id)/cancel" -Method POST -Headers $headers
if ($cancelledSale.status -ne "CANCELLED") { throw "Venda confirmada nao foi estornada." }

Write-Host "=== Compra Confirmada -> Estorno ===" -ForegroundColor Cyan
$purchase = Invoke-RestMethod -Uri "$BaseUrl/purchases" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  branchId = $mainBranchId
  supplierId = $supplierId
  number = "SMK-REV-COMP-$suffix"
  items = @(@{
    productId = $productId
    quantity = 1
    unitCost = 4
  })
} | ConvertTo-Json -Depth 10)
Invoke-RestMethod -Uri "$BaseUrl/purchases/$($purchase.id)/confirm" -Method POST -Headers $headers | Out-Null
$cancelledPurchase = Invoke-RestMethod -Uri "$BaseUrl/purchases/$($purchase.id)/cancel" -Method POST -Headers $headers
if ($cancelledPurchase.status -ne "CANCELLED") { throw "Compra confirmada nao foi estornada." }

Write-Host "=== Relatorios ===" -ForegroundColor Cyan
$report = Invoke-RestMethod -Uri "$BaseUrl/reports/summary" -Headers $headers
$lowStock = Invoke-RestMethod -Uri "$BaseUrl/reports/low-stock" -Headers $headers
$report | ConvertTo-Json -Depth 10
Write-Host "Itens com estoque baixo: $($lowStock.Count)"

Write-Host "`nSMOKE OPERACOES V2 CONCLUIDO COM SUCESSO." -ForegroundColor Green
