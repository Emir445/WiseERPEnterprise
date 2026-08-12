import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Alert, Card, PageHeader, Spinner, Stat, Badge } from '../components/Ui';

type Summary = any;
const money = (v: unknown) => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export function Dashboard() {
  const [data,setData]=useState<Summary>(); const [error,setError]=useState('');
  useEffect(()=>{api('/dashboard/summary?days=30').then(setData).catch(e=>setError(e.message));},[]);
  return <><PageHeader title="Dashboard" subtitle="Visão executiva dos últimos 30 dias" />{error&&<Alert>{error}</Alert>}{!data?<Spinner/>:<>
    <div className="stats-grid"><Stat label="Vendas confirmadas" value={money(data.sales.total)} hint={`${data.sales.count} vendas`} /><Stat label="Compras confirmadas" value={money(data.purchases.total)} hint={`${data.purchases.count} compras`} /><Stat label="A receber" value={money(data.receivables.open)} hint={`${data.receivables.count} títulos em aberto`} /><Stat label="A pagar" value={money(data.payables.open)} hint={`${data.payables.count} títulos em aberto`} /></div>
    <div className="dashboard-grid"><Card><div className="card-heading"><div><h3>Saúde do estoque</h3><p>Itens no nível mínimo ou abaixo</p></div><span className="counter">{data.inventory.lowStockCount}</span></div><div className="table-wrap"><table><thead><tr><th>Produto</th><th>Filial</th><th>Disponível</th><th>Mínimo</th><th>Status</th></tr></thead><tbody>{data.inventory.lowStock.slice(0,8).map((x:any)=><tr key={`${x.branch.id}-${x.product.id}`}><td><strong>{x.product.name}</strong><small>{x.product.sku}</small></td><td>{x.branch.name}</td><td>{Number(x.available)}</td><td>{Number(x.product.minimumStock)}</td><td><Badge value="ATENÇÃO" /></td></tr>)}</tbody></table></div></Card><Card><div className="card-heading"><div><h3>Indicadores rápidos</h3><p>Resumo operacional</p></div></div><div className="mini-metrics"><div><span>Saldos monitorados</span><strong>{data.inventory.balances}</strong></div><div><span>Recebido</span><strong>{money(data.receivables.paid)}</strong></div><div><span>Pago</span><strong>{money(data.payables.paid)}</strong></div><div><span>Período</span><strong>{data.period.days} dias</strong></div></div></Card></div>
  </>}</>;
}
