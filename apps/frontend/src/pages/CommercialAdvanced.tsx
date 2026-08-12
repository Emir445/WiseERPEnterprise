import { AdvancedModulePage, col } from './AdvancedModulePage';
export function CommercialAdvanced(){return <AdvancedModulePage title="Comercial" subtitle="Orçamentos, pedidos de venda e condições comerciais" tabs={[
 {key:'quotes',label:'Orçamentos',endpoint:'/quotes',search:true,columns:[col.text('Número','number'),col.nested('Cliente','customer.name'),col.date('Validade','validUntil'),col.money('Total','totalAmount'),col.status()],actions:[
  {label:'Enviar',permission:'quotes.update',path:r=>`/quotes/${r.id}/send`,show:r=>r.status==='DRAFT'},
  {label:'Aprovar',permission:'quotes.approve',path:r=>`/quotes/${r.id}/approve`,show:r=>['DRAFT','SENT'].includes(r.status),tone:'primary'},
  {label:'Rejeitar',permission:'quotes.approve',path:r=>`/quotes/${r.id}/reject`,show:r=>['DRAFT','SENT'].includes(r.status),tone:'danger'}]},
 {key:'orders',label:'Pedidos de venda',endpoint:'/sales-orders',search:true,columns:[col.text('Número','number'),col.nested('Cliente','customer.name'),col.money('Total','totalAmount'),col.status(),col.text('Reserva','reservedAt')],actions:[
  {label:'Confirmar',permission:'sales_orders.confirm',path:r=>`/sales-orders/${r.id}/confirm`,show:r=>r.status==='DRAFT',tone:'primary'},
  {label:'Reservar',permission:'sales_orders.reserve',path:r=>`/sales-orders/${r.id}/reserve`,show:r=>['CONFIRMED','PARTIAL'].includes(r.status)},
  {label:'Liberar',permission:'sales_orders.reserve',path:r=>`/sales-orders/${r.id}/release-reservation`,show:r=>!!r.reservedAt},
  {label:'Cancelar',permission:'sales_orders.cancel',path:r=>`/sales-orders/${r.id}/cancel`,show:r=>!['CANCELLED','FULFILLED'].includes(r.status),tone:'danger'}]},
 {key:'terms',label:'Condições de pagamento',endpoint:'/payment-terms',columns:[col.text('Nome','name'),col.text('Parcelas','installments'),col.text('1º vencimento','firstDueDays'),col.text('Intervalo','intervalDays'),col.status()]}
 ]}/>}
