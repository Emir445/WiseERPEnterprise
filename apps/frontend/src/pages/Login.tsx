import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@cerradusgelo.local');
  const [password, setPassword] = useState('WiseERP@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/'); } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao entrar.'); } finally { setLoading(false); }
  }
  return <div className="login-page"><div className="login-visual"><div className="login-brand"><span className="brand-mark large">W</span><div><h1>Wise One</h1><p>Enterprise ERP</p></div></div><div className="hero-copy"><span className="eyebrow light">Gestão integrada</span><h2>Controle sua operação de ponta a ponta.</h2><p>Comercial, estoque, financeiro, logística, produção e serviços em uma única plataforma.</p></div><div className="visual-grid"><div/><div/><div/><div/></div></div><div className="login-panel"><form className="login-card" onSubmit={submit}><div><span className="eyebrow">Acesso seguro</span><h2>Entrar na plataforma</h2><p>Use suas credenciais para acessar o ambiente da empresa.</p></div>{error && <div className="alert error">{error}</div>}<label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button className="primary-button full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button><small className="form-note">Ambiente local conectado a http://localhost:3000</small></form></div></div>;
}
