import { AdvancedModulePage, col } from './AdvancedModulePage';
export function AdministrationPage(){return <AdvancedModulePage title="Administração" subtitle="Estruturas organizacionais e classificações do ERP" tabs={[
 {key:'branches',label:'Filiais',endpoint:'/branches',search:true,columns:[col.text('Nome','name'),col.text('Código','code'),col.text('Documento','document'),col.text('Telefone','phone'),col.status()]},
 {key:'categories',label:'Categorias',endpoint:'/product-categories',columns:[col.text('Nome','name'),col.text('Descrição','description'),col.status()]},
 {key:'accounts',label:'Plano de contas',endpoint:'/chart-accounts',columns:[col.text('Código','code'),col.text('Nome','name'),col.text('Tipo','type'),col.status()]},
 {key:'cost-centers',label:'Centros de custo',endpoint:'/cost-centers',columns:[col.text('Código','code'),col.text('Nome','name'),col.status()]}
 ]}/>}
