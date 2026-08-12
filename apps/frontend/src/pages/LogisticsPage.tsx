import { AdvancedModulePage, col } from './AdvancedModulePage';
export function LogisticsPage(){return <AdvancedModulePage title="Logística" subtitle="Separação, expedições, entregas, transportadoras e devoluções" tabs={[
 {key:'shipments',label:'Expedições',endpoint:'/logistics/shipments',columns:[col.text('Número','number'),col.nested('Pedido','salesOrder.number'),col.nested('Transportadora','carrier.name'),col.text('Rastreio','trackingCode'),col.status()],actions:[
  {label:'Separar',permission:'logistics.shipments.pick',path:r=>`/logistics/shipments/${r.id}/pick`,show:r=>r.status==='DRAFT'},
  {label:'Expedir',permission:'logistics.shipments.ship',path:r=>`/logistics/shipments/${r.id}/ship`,show:r=>r.status==='PICKED',tone:'primary'},
  {label:'Entregar',permission:'logistics.shipments.deliver',path:r=>`/logistics/shipments/${r.id}/deliver`,show:r=>r.status==='SHIPPED',tone:'primary'},
  {label:'Cancelar',permission:'logistics.shipments.cancel',path:r=>`/logistics/shipments/${r.id}/cancel`,show:r=>!['DELIVERED','CANCELLED'].includes(r.status),tone:'danger'}]},
 {key:'returns',label:'Devoluções',endpoint:'/logistics/returns',columns:[col.text('Número','number'),col.nested('Cliente','customer.name'),col.text('Motivo','reason'),col.status(),col.date('Data','createdAt')],actions:[{label:'Receber',permission:'logistics.returns.receive',path:r=>`/logistics/returns/${r.id}/receive`,show:r=>r.status==='OPEN',tone:'primary'},{label:'Cancelar',permission:'logistics.returns.cancel',path:r=>`/logistics/returns/${r.id}/cancel`,show:r=>r.status==='OPEN',tone:'danger'}]},
 {key:'carriers',label:'Transportadoras',endpoint:'/carriers',columns:[col.text('Nome','name'),col.text('Documento','document'),col.text('Telefone','phone'),col.text('E-mail','email'),col.status()]}
 ]}/>}
