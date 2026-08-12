import { AdvancedModulePage, col } from './AdvancedModulePage';
export function CrmPage(){return <AdvancedModulePage title="CRM" subtitle="Leads, oportunidades e acompanhamento comercial" tabs={[
 {key:'leads',label:'Leads',endpoint:'/crm/leads',columns:[col.text('Nome','name'),col.text('Empresa','companyName'),col.text('E-mail','email'),col.text('Telefone','phone'),col.status()]},
 {key:'opportunities',label:'Oportunidades',endpoint:'/crm/opportunities',columns:[col.text('Título','title'),col.nested('Cliente','customer.name'),col.text('Etapa','stage'),col.money('Valor','amount'),col.date('Fechamento','expectedCloseDate'),col.status()]}
 ]}/>}
