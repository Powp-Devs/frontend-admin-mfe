import { api } from './api';
import { clearSession, getStoredUser, getToken, saveSession } from './session';
import { AuthUser, LoginResponse } from '@/types';

export class NotPlatformAdminError extends Error {
  constructor() {
    super('Este usuário não é administrador da plataforma.');
    this.name = 'NotPlatformAdminError';
  }
}

export const authService = {
  // O painel só guarda a sessão de quem tem admin_plataforma; o backend valida
  // a mesma permissão em cada rota (require_platform_admin).
  async login(usuario: string, senha: string): Promise<AuthUser> {
    const { data } = await api.post<LoginResponse>('/usuarios/login', { usuario, senha });
    if (!data.user?.admin_plataforma) throw new NotPlatformAdminError();
    saveSession(data.access_token, data.user);
    return data.user;
  },

  logout(): void {
    clearSession();
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  getUser(): AuthUser | null {
    return getStoredUser<AuthUser>();
  },
};
