import { AdvancedModulePage, col } from './AdvancedModulePage';
export function TreasuryPage(){return <AdvancedModulePage title="Tesouraria" subtitle="Contas, movimentos, caixas e fluxo financeiro" tabs={[
 {key:'accounts',label:'Contas',endpoint:'/treasury/accounts',columns:[col.text('Nome','name'),col.text('Tipo','type'),col.nested('Filial','branch.name'),col.money('Saldo atual','currentBalance'),col.status()]},
 {key:'movements',label:'Movimentações',endpoint:'/treasury/movements',columns:[col.date('Data','createdAt'),col.nested('Conta','treasuryAccount.name'),col.text('Tipo','type'),col.text('Descrição','description'),col.money('Valor','amount'),col.money('Saldo','balanceAfter')]},
 {key:'cash',label:'Sessões de caixa',endpoint:'/treasury/cash-sessions',columns:[col.nested('Conta','treasuryAccount.name'),col.date('Abertura','openedAt'),col.money('Inicial','openingAmount'),col.money('Fechamento','actualClosingAmount'),col.status()]}
 ]}/>}
