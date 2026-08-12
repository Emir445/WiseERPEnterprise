$ErrorActionPreference='Stop'; $base='http://localhost:3000/api'
$login=Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{email='admin@cerradusgelo.local';password='WiseERP@123'}|ConvertTo-Json); $h=@{Authorization="Bearer $($login.accessToken)"}
$branches = Invoke-RestMethod -Uri "$base/branches" -Headers $h

if ($null -ne $branches.data) {
  $branchList = $branches.data
}
else {
  $branchList = $branches
}

$branchId = $branchList[0].id
$stamp=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$lead=Invoke-RestMethod -Uri "$base/crm/leads" -Method POST -Headers $h -ContentType 'application/json' -Body (@{name="Lead Smoke $stamp";email="lead$stamp@teste.local";source='SMOKE'}|ConvertTo-Json)
$opp=Invoke-RestMethod -Uri "$base/crm/opportunities" -Method POST -Headers $h -ContentType 'application/json' -Body (@{leadId=$lead.id;title='Oportunidade Smoke';amount=500;probability=60}|ConvertTo-Json)
$act=Invoke-RestMethod -Uri "$base/crm/activities" -Method POST -Headers $h -ContentType 'application/json' -Body (@{leadId=$lead.id;opportunityId=$opp.id;type='TASK';subject='Follow-up smoke'}|ConvertTo-Json)
Invoke-RestMethod -Uri "$base/crm/activities/$($act.id)/complete" -Method PATCH -Headers $h | Out-Null
$customer=Invoke-RestMethod -Uri "$base/crm/leads/$($lead.id)/convert" -Method POST -Headers $h -ContentType 'application/json' -Body (@{document="9$stamp"}|ConvertTo-Json)
$products=Invoke-RestMethod -Uri "$base/products?limit=100" -Headers $h; $product=($products.data | Select-Object -First 1); if(!$product){throw 'Nenhum produto disponÃ­vel para smoke.'}
try { Invoke-RestMethod -Uri "$base/inventory/entry" -Method POST -Headers $h -ContentType 'application/json' -Body (@{branchId=$branchId;productId=$product.id;quantity=2;referenceType='SMOKE';notes='Carga OS'}|ConvertTo-Json) | Out-Null } catch {}
$os=Invoke-RestMethod -Uri "$base/service-orders" -Method POST -Headers $h -ContentType 'application/json' -Body (@{branchId=$branchId;customerId=$customer.id;number="OS-$stamp";title='OS Smoke CRM'}|ConvertTo-Json)
Invoke-RestMethod -Uri "$base/service-orders/$($os.id)/start" -Method PATCH -Headers $h | Out-Null
Invoke-RestMethod -Uri "$base/service-orders/$($os.id)/materials" -Method POST -Headers $h -ContentType 'application/json' -Body (@{productId=$product.id;quantity=1}|ConvertTo-Json) | Out-Null
Invoke-RestMethod -Uri "$base/service-orders/$($os.id)/time-entries" -Method POST -Headers $h -ContentType 'application/json' -Body (@{minutes=60;hourlyRate=80;notes='Atendimento smoke'}|ConvertTo-Json) | Out-Null
Invoke-RestMethod -Uri "$base/service-orders/$($os.id)/complete" -Method PATCH -Headers $h | Out-Null
$inv=Invoke-RestMethod -Uri "$base/service-orders/$($os.id)/invoice" -Method POST -Headers $h -ContentType 'application/json' -Body (@{saleNumber="VEN-OS-$stamp"}|ConvertTo-Json)
if($inv.status -ne 'INVOICED'){throw 'OS nÃ£o faturada.'}
Write-Host 'SMOKE CRM + SERVICOS V1 CONCLUIDO COM SUCESSO.' -ForegroundColor Green

