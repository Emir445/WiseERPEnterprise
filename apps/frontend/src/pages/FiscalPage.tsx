import { AdvancedModulePage, col } from './AdvancedModulePage';
export function FiscalPage(){return <AdvancedModulePage title="Fiscal" subtitle="Documentos fiscais internos vinculados ao faturamento" tabs={[
 {key:'documents',label:'Documentos fiscais',endpoint:'/fiscal/documents',columns:[col.text('Número','number'),col.text('Série','series'),col.text('Tipo','type'),col.nested('Venda','sale.number'),col.money('Total','totalAmount'),col.status()],actions:[{label:'Cancelar',permission:'fiscal.cancel',path:r=>`/fiscal/documents/${r.id}/cancel`,show:r=>r.status!=='CANCELLED',tone:'danger'}]}
 ]}/>}
