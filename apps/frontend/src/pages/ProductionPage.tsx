import { AdvancedModulePage, col } from './AdvancedModulePage';
export function ProductionPage(){return <AdvancedModulePage title="Produção / PCP" subtitle="Fichas técnicas, ordens e execução da produção" tabs={[
 {key:'orders',label:'Ordens de produção',endpoint:'/production/orders',columns:[col.text('Número','number'),col.nested('Produto','product.name'),col.text('Planejado','plannedQuantity'),col.text('Produzido','producedQuantity'),col.money('Custo realizado','actualCost'),col.status()],actions:[
  {label:'Iniciar',permission:'production.orders.start',path:r=>`/production/orders/${r.id}/start`,show:r=>r.status==='PLANNED',tone:'primary'},
  {label:'Concluir',permission:'production.orders.complete',path:r=>`/production/orders/${r.id}/complete`,show:r=>r.status==='IN_PROGRESS',tone:'primary'},
  {label:'Cancelar',permission:'production.orders.cancel',path:r=>`/production/orders/${r.id}/cancel`,show:r=>!['COMPLETED','CANCELLED'].includes(r.status),tone:'danger'}]},
 {key:'boms',label:'Fichas técnicas / BOM',endpoint:'/production/boms',columns:[col.nested('Produto','product.name'),col.text('Versão','version'),col.text('Rendimento','outputQuantity'),col.status(),col.date('Atualizado','updatedAt')]}
 ]}/>}
