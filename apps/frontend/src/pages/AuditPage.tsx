import { AdvancedModulePage, col } from './AdvancedModulePage';
export function AuditPage(){return <AdvancedModulePage title="Auditoria" subtitle="Rastreabilidade das operações registradas no ERP" tabs={[
 {key:'logs',label:'Eventos',endpoint:'/audit-logs',columns:[col.date('Data','createdAt'),col.text('Ação','action'),col.text('Entidade','entity'),col.text('Registro','entityId'),col.text('Usuário','actorUserId'),col.text('IP','ipAddress')]}
 ]}/>}
