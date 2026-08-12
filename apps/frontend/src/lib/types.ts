export type SessionUser = {
  id: string;
  name: string;
  email: string;
  company: { id: string; legalName: string; tradeName?: string | null };
  branch: { id: string; name: string; code: string } | null;
  roles: string[];
  permissions: string[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  user: SessionUser;
};

export type PageResult<T> = {
  data: T[];
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
};
