export interface JwtPayload {
  sub: string;
  companyId: string;
  branchId?: string;
  sessionId: string;
}