import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Alert, Badge, Card, Empty, PageHeader, Spinner } from '../components/Ui';

type Kind='inventory'|'purchases'|'sales'|'finance';
const cfg:any={
 inventory:{title:'Estoque',subtitle:'Saldos por produto e filial',url:'/inventory',cols:['Produto','Filial','Quantidade','Reservado','Disponível']},
 purchases:{title:'Compras',subtitle:'Acompanhamento das compras e fornecedores',url:'/purchases',cols:['Número','Fornecedor','Data','Total','Status']},
 sales:{title:'Vendas',subtitle:'Vendas, clientes e faturamento',url:'/sales',cols:['Número','Cliente','Data','Total','Status']},
 finance:{title:'Financeiro',subtitle:'Contas a receber e a pagar',url:'/finance/entries',cols:['Descrição','Tipo','Vencimento','Valor','Pago','Status']}
};
const money=(v:any)=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); const date=(v:any)=>v?new Date(v).toLocaleDateString('pt-BR'):'-';
export function DataTablePage({kind}:{kind:Kind}){const c=cfg[kind];const [rows,setRows]=useState<any[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState('');const[search,setSearch]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{const q=search?`?search=${encodeURIComponent(search)}`:'';const r:any=await api(c.url+q);setRows(r.data||r);}catch(e){setError(e instanceof Error?e.message:'Erro ao carregar')}finally{setLoading(false)}},[c.url,search]);useEffect(()=>{void load()},[load]);
 function cells(r:any){if(kind==='inventory')return [<><strong>{r.product?.name}</strong><small>{r.product?.sku}</small></>,r.branch?.name,Number(r.quantity),Number(r.reserved),Number(r.available)];if(kind==='purchases')return [r.number,r.supplier?.name,date(r.issueDate),money(r.totalAmount),<Badge value={r.status}/>];if(kind==='sales')return [r.number,r.customer?.name,date(r.issueDate),money(r.totalAmount),<Badge value={r.status}/>];return [<><strong>{r.description||r.referenceType||'Lançamento'}</strong><small>{r.installmentNumber?`Parcela ${r.installmentNumber}`:''}</small></>,r.type,date(r.dueDate),money(r.amount),money(r.paidAmount),<Badge value={r.status}/>];}
 return <><PageHeader title={c.title} subtitle={c.subtitle}/><Card><div className="toolbar"><div className="search"><span>⌕</span><input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="ghost-button" onClick={load}>Atualizar</button></div>{error&&<Alert>{error}</Alert>}{loading?<Spinner/>:rows.length===0?<Empty/>:<div className="table-wrap"><table><thead><tr>{c.cols.map((x:string)=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}>{cells(r).map((v:any,i:number)=><td key={i}>{v}</td>)}</tr>)}</tbody></table></div>}</Card></>}
