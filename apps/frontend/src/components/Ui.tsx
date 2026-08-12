import type { PropsWithChildren, ReactNode } from 'react';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="page-actions">{actions}</div></div>;
}
export function Card({ children, className = '' }: PropsWithChildren<{className?: string}>) { return <div className={`card ${className}`}>{children}</div>; }
export function Stat({ label, value, hint }: {label: string; value: string; hint?: string}) { return <Card className="stat-card"><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</Card>; }
export function Empty({ text = 'Nenhum registro encontrado.' }: {text?: string}) { return <div className="empty"><div>◇</div><p>{text}</p></div>; }
export function Spinner() { return <div className="spinner-wrap"><div className="spinner" /></div>; }
export function Alert({ children, type='error' }: PropsWithChildren<{type?: 'error'|'success'}>) { return <div className={`alert ${type}`}>{children}</div>; }
export function Badge({ value }: {value?: string | null}) { const v = value || '-'; const cls = /ACTIVE|CONFIRMED|PAID|FULFILLED/.test(v) ? 'good' : /CANCELLED|BLOCKED|INACTIVE/.test(v) ? 'bad' : 'neutral'; return <span className={`badge ${cls}`}>{v}</span>; }
