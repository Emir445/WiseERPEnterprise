$ErrorActionPreference='Stop'
$base='http://localhost:3000/api'
$login=Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{email='admin@cerradusgelo.local';password='WiseERP@123'}|ConvertTo-Json)
$h=@{Authorization="Bearer $($login.accessToken)"}
$me=Invoke-RestMethod -Uri "$base/auth/me" -Headers $h
$branchId=$me.branch.id
$products=Invoke-RestMethod -Uri "$base/products" -Headers $h
$productId=$products.data[0].id
$customers=Invoke-RestMethod -Uri "$base/customers" -Headers $h
$customerId=$customers.data[0].id
$stamp=Get-Date -Format 'yyyyMMddHHmmss'

# Garante saldo para reserva/expedicao
Invoke-RestMethod -Uri "$base/inventory/entry" -Method POST -Headers $h -ContentType 'application/json' -Body (@{branchId=$branchId;productId=$productId;quantity=10;referenceType='SMOKE_LOGISTICS';notes='Carga smoke logística'}|ConvertTo-Json) | Out-Null

$carrier=Invoke-RestMethod -Uri "$base/carriers" -Method POST -Headers $h -ContentType 'application/json' -Body (@{name="Transportadora Smoke $stamp";document="TR$stamp"}|ConvertTo-Json)
$order=Invoke-RestMethod -Uri "$base/sales-orders" -Method POST -Headers $h -ContentType 'application/json' -Body (@{branchId=$branchId;customerId=$customerId;number="PV-$stamp";items=@(@{productId=$productId;quantity=4;unitPrice=2.5;discountAmount=0})}|ConvertTo-Json -Depth 8)
Invoke-RestMethod -Uri "$base/sales-orders/$($order.id)/confirm" -Method POST -Headers $h | Out-Null
$reserved=Invoke-RestMethod -Uri "$base/sales-orders/$($order.id)/reserve" -Method POST -Headers $h
if([decimal]$reserved.items[0].reservedQuantity -lt 4){throw 'Reserva não foi criada'}

$shipment=Invoke-RestMethod -Uri "$base/logistics/shipments" -Method POST -Headers $h -ContentType 'application/json' -Body (@{salesOrderId=$order.id;carrierId=$carrier.id;number="EXP-$stamp";trackingCode="TRACK-$stamp";items=@(@{salesOrderItemId=$order.items[0].id;quantity=2})}|ConvertTo-Json -Depth 8)
Invoke-RestMethod -Uri "$base/logistics/shipments/$($shipment.id)/pick" -Method POST -Headers $h | Out-Null
$shipped=Invoke-RestMethod -Uri "$base/logistics/shipments/$($shipment.id)/ship" -Method POST -Headers $h
if($shipped.status -ne 'SHIPPED'){throw 'Expedição não foi enviada'}
$delivered=Invoke-RestMethod -Uri "$base/logistics/shipments/$($shipment.id)/deliver" -Method POST -Headers $h
if($delivered.status -ne 'DELIVERED'){throw 'Expedição não foi entregue'}

# Venda + devolução para validar retorno ao estoque
$sale=Invoke-RestMethod -Uri "$base/sales" -Method POST -Headers $h -ContentType 'application/json' -Body (@{branchId=$branchId;customerId=$customerId;number="VEN-RET-$stamp";items=@(@{productId=$productId;quantity=1;unitPrice=2.5;discountAmount=0})}|ConvertTo-Json -Depth 8)
Invoke-RestMethod -Uri "$base/sales/$($sale.id)/confirm" -Method POST -Headers $h | Out-Null
$ret=Invoke-RestMethod -Uri "$base/logistics/returns" -Method POST -Headers $h -ContentType 'application/json' -Body (@{saleId=$sale.id;number="DEV-$stamp";items=@(@{productId=$productId;quantity=1;reason='Smoke';restock=$true})}|ConvertTo-Json -Depth 8)
$received=Invoke-RestMethod -Uri "$base/logistics/returns/$($ret.id)/receive" -Method POST -Headers $h
if($received.status -ne 'RECEIVED'){throw 'Devolução não foi recebida'}

Write-Host 'SMOKE LOGISTICA + COMMERCIAL V3 CONCLUIDO COM SUCESSO.' -ForegroundColor Green
