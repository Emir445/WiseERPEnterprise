import type { AuthResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const ACCESS = 'wise.accessToken';
const REFRESH = 'wise.refreshToken';
const USER = 'wise.user';

export const sessionStore = {
  access: () => localStorage.getItem(ACCESS),
  refresh: () => localStorage.getItem(REFRESH),
  user: () => {
    const value = localStorage.getItem(USER);
    return value ? JSON.parse(value) : null;
  },
  save(auth: AuthResponse) {
    localStorage.setItem(ACCESS, auth.accessToken);
    localStorage.setItem(REFRESH, auth.refreshToken);
    localStorage.setItem(USER, JSON.stringify(auth.user));
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
  },
};

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof body === 'object' && body ? body.message : body;
    const text = Array.isArray(message) ? message.join(', ') : message;
    const error = new Error(text || `Erro HTTP ${response.status}`) as Error & { status?: number; body?: unknown };
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function refreshAccessToken() {
  const refreshToken = sessionStore.refresh();
  if (!refreshToken) throw new Error('Sessão expirada.');
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await parseResponse(response) as { accessToken: string };
  localStorage.setItem(ACCESS, data.accessToken);
  return data.accessToken;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = sessionStore.access();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && sessionStore.refresh()) {
    try {
      await refreshAccessToken();
      return api<T>(path, init, false);
    } catch {
      sessionStore.clear();
      window.location.assign('/login');
    }
  }
  return parseResponse(response) as Promise<T>;
}

export const authApi = {
  login: (email: string, password: string) => api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  logout: async () => {
    const refreshToken = sessionStore.refresh();
    if (refreshToken) {
      try { await api('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false); } catch { /* ignore */ }
    }
    sessionStore.clear();
  },
};
