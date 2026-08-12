import { AdvancedModulePage, col } from './AdvancedModulePage';
export function ProcurementPage(){return <AdvancedModulePage title="Procurement" subtitle="Requisições, pedidos e recebimentos de compras" tabs={[
 {key:'requests',label:'Requisições',endpoint:'/procurement/requests',columns:[col.text('Número','number'),col.nested('Filial','branch.name'),col.date('Data','createdAt'),col.status()],actions:[{label:'Abrir',permission:'procurement.requests.approve',path:r=>`/procurement/requests/${r.id}/open`,show:r=>r.status==='DRAFT',tone:'primary'}]},
 {key:'orders',label:'Pedidos de compra',endpoint:'/procurement/orders',columns:[col.text('Número','number'),col.nested('Fornecedor','supplier.name'),col.money('Total','totalAmount'),col.status(),col.date('Data','createdAt')],actions:[{label:'Confirmar',permission:'procurement.orders.confirm',path:r=>`/procurement/orders/${r.id}/confirm`,show:r=>r.status==='DRAFT',tone:'primary'}]},
 {key:'pending',label:'Pendentes',endpoint:'/procurement/orders-pending',columns:[col.text('Número','number'),col.nested('Fornecedor','supplier.name'),col.status(),col.date('Data','createdAt')]}
 ]}/>}
