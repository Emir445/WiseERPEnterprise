import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const groups = [
  { title: 'Visão geral', items: [{ to: '/', label: 'Dashboard', icon: '▦', p: 'dashboard.read' }] },
  { title: 'Cadastros', items: [
    { to: '/customers', label: 'Clientes', icon: '◉', p: 'customers.read' },
    { to: '/suppliers', label: 'Fornecedores', icon: '◆', p: 'suppliers.read' },
    { to: '/products', label: 'Produtos', icon: '▣', p: 'products.read' },
    { to: '/administration', label: 'Administração', icon: '⚙', p: 'branches.read' },
  ] },
  { title: 'Operações', items: [
    { to: '/inventory', label: 'Estoque', icon: '▥', p: 'inventory.read' },
    { to: '/purchases', label: 'Compras', icon: '↓', p: 'purchases.read' },
    { to: '/sales', label: 'Vendas', icon: '↑', p: 'sales.read' },
    { to: '/finance', label: 'Financeiro', icon: '$', p: 'finance.read' },
    { to: '/treasury', label: 'Tesouraria', icon: '◫', p: 'treasury.read' },
  ] },
  { title: 'Comercial', items: [
    { to: '/commercial', label: 'Comercial', icon: '◎', p: 'quotes.read' },
    { to: '/crm', label: 'CRM', icon: '◌', p: 'crm.leads.read' },
    { to: '/services', label: 'Serviços / OS', icon: '◇', p: 'services.orders.read' },
  ] },
  { title: 'Supply & Logística', items: [
    { to: '/procurement', label: 'Procurement', icon: '⇣', p: 'procurement.orders.read' },
    { to: '/logistics', label: 'Logística', icon: '⇢', p: 'logistics.shipments.read' },
    { to: '/production', label: 'Produção / PCP', icon: '◈', p: 'production.orders.read' },
  ] },
  { title: 'Governança', items: [
    { to: '/fiscal', label: 'Fiscal', icon: '▤', p: 'fiscal.read' },
    { to: '/audit', label: 'Auditoria', icon: '◍', p: 'users.read' },
  ] },
];

export function Layout() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">W</span><div><strong>Wise One</strong><small>Enterprise</small></div></div>
      <nav className="nav-scroll">
        {groups.map(group => { const visible = group.items.filter(i => can(i.p)); return visible.length ? <div className="nav-group" key={group.title}><span className="nav-title">{group.title}</span>{visible.map(i => <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}><span className="nav-icon">{i.icon}</span><span>{i.label}</span></NavLink>)}</div> : null; })}
      </nav>
      <div className="sidebar-footer"><div className="user-avatar">{user?.name?.slice(0,2).toUpperCase()}</div><div className="user-summary"><strong>{user?.name}</strong><small>{user?.branch?.name || 'Todas as filiais'}</small></div></div>
    </aside>
    <main className="content-shell"><header className="topbar"><div><span className="eyebrow">{user?.company.tradeName || user?.company.legalName}</span></div><div className="top-actions"><button className="icon-button" title="Atualizar" onClick={() => window.location.reload()}>↻</button><button className="ghost-button" onClick={async () => { await logout(); navigate('/login'); }}>Sair</button></div></header><section className="page"><Outlet /></section></main>
  </div>;
}
