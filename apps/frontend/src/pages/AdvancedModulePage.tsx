import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Alert, Badge, Card, Empty, PageHeader, Spinner } from '../components/Ui';

type Row = Record<string, any>;
type Col = { label: string; value: (row: Row) => ReactNode };
type Action = { label: string; permission?: string; path: (row: Row) => string; show?: (row: Row) => boolean; tone?: 'primary'|'ghost'|'danger' };
type Tab = { key: string; label: string; endpoint: string; columns: Col[]; actions?: Action[]; search?: boolean };

type Props = { title: string; subtitle: string; tabs: Tab[] };

const money = (value: any) => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const date = (value: any) => value ? new Date(value).toLocaleDateString('pt-BR') : '-';
const text = (value: any) => value ?? '-';

export const advancedFormat = { money, date, text };

export function AdvancedModulePage({ title, subtitle, tabs }: Props) {
  const { can } = useAuth();
  const [active, setActive] = useState(tabs[0].key);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const tab = useMemo(() => tabs.find(t => t.key === active) || tabs[0], [active, tabs]);

  const load = useCallback(async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const suffix = tab.search && search ? `?search=${encodeURIComponent(search)}` : '';
      const response: any = await api(tab.endpoint + suffix);
      setRows(response?.data || response || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados.');
    } finally { setLoading(false); }
  }, [tab, search]);

  useEffect(() => { void load(); }, [load]);

  async function runAction(action: Action, row: Row) {
    setError(''); setSuccess('');
    try {
      await api(action.path(row), { method: 'POST', body: JSON.stringify({}) });
      setSuccess('Operação concluída com sucesso.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível executar a operação.'); }
  }

  return <>
    <PageHeader title={title} subtitle={subtitle} actions={<button className="ghost-button" onClick={load}>Atualizar</button>} />
    <div className="module-tabs">{tabs.map(t => <button key={t.key} className={active===t.key?'module-tab active':'module-tab'} onClick={()=>{setActive(t.key);setSearch('')}}>{t.label}</button>)}</div>
    <Card>
      <div className="toolbar">
        {tab.search ? <div className="search"><span>⌕</span><input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} /></div> : <div className="table-caption">{tab.label}</div>}
        <span className="record-count">{rows.length} registro(s)</span>
      </div>
      {error && <Alert>{error}</Alert>}{success && <Alert type="success">{success}</Alert>}
      {loading ? <Spinner/> : rows.length===0 ? <Empty/> : <div className="table-wrap"><table><thead><tr>{tab.columns.map(c=><th key={c.label}>{c.label}</th>)}{tab.actions?.length ? <th>Ações</th> : null}</tr></thead><tbody>{rows.map((r:any)=><tr key={r.id || JSON.stringify(r)}>{tab.columns.map((c,i)=><td key={i}>{c.value(r)}</td>)}{tab.actions?.length ? <td><div className="row-actions">{tab.actions.filter(a => can(a.permission) && (!a.show || a.show(r))).map(a=><button key={a.label} className={a.tone==='danger'?'table-action danger':a.tone==='primary'?'table-action primary':'table-action'} onClick={()=>void runAction(a,r)}>{a.label}</button>)}</div></td> : null}</tr>)}</tbody></table></div>}
    </Card>
  </>;
}

export const col = {
  text: (label: string, key: string): Col => ({label, value:r=>text(r[key])}),
  status: (label='Status', key='status'): Col => ({label, value:r=><Badge value={r[key]}/>}),
  money: (label:string,key:string): Col => ({label,value:r=>money(r[key])}),
  date: (label:string,key:string): Col => ({label,value:r=>date(r[key])}),
  nested: (label:string,path:string): Col => ({label,value:r=>text(path.split('.').reduce((a,k)=>a?.[k],r))}),
  named: (label:string,namePath:string,subPath?:string): Col => ({label,value:r=><><strong>{text(namePath.split('.').reduce((a,k)=>a?.[k],r))}</strong>{subPath?<small>{text(subPath.split('.').reduce((a,k)=>a?.[k],r))}</small>:null}</>}),
};
