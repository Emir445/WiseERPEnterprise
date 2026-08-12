import { AdvancedModulePage, col } from './AdvancedModulePage';
export function ServicesPage(){return <AdvancedModulePage title="Ordens de Serviço" subtitle="Execução de serviços, materiais, horas e faturamento" tabs={[
 {key:'orders',label:'Ordens de serviço',endpoint:'/service-orders',columns:[col.text('Número','number'),col.nested('Cliente','customer.name'),col.nested('Técnico','assignedUser.name'),col.text('Prioridade','priority'),col.money('Total','totalAmount'),col.status()],actions:[
  {label:'Iniciar',permission:'services.orders.execute',path:r=>`/service-orders/${r.id}/start`,show:r=>r.status==='OPEN',tone:'primary'},
  {label:'Concluir',permission:'services.orders.execute',path:r=>`/service-orders/${r.id}/complete`,show:r=>r.status==='IN_PROGRESS',tone:'primary'}]}
 ]}/>}
