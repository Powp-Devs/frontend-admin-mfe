import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { api } from './api';
import { authService, NotPlatformAdminError } from './authService';
import { getSessionEndMessage, getToken } from './session';

describe('authService.login', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  const loginResponse = (admin_plataforma: boolean) => ({
    data: { access_token: 'tok', token_type: 'bearer', user: { usuario: 'admin', admin_plataforma } },
  });

  it('stores the session for platform admins', async () => {
    vi.spyOn(api, 'post').mockResolvedValue(loginResponse(true));
    await authService.login('admin', 'senha');
    expect(getToken()).toBe('tok');
    expect(authService.getUser()?.usuario).toBe('admin');
  });

  it('rejects users without admin_plataforma and stores nothing', async () => {
    vi.spyOn(api, 'post').mockResolvedValue(loginResponse(false));
    await expect(authService.login('comum', 'senha')).rejects.toBeInstanceOf(NotPlatformAdminError);
    expect(getToken()).toBeNull();
  });
});

describe('getSessionEndMessage', () => {
  it('ends the session on 401, lost platform permission, blocked company and inactive user', () => {
    expect(getSessionEndMessage(401, 'Token inválido', '/empresas/listar')).toMatch(/expirou/);
    expect(getSessionEndMessage(403, 'Administrador da plataforma necessario.', '/empresas/listar')).toMatch(/não é mais/);
    expect(getSessionEndMessage(403, 'Empresa bloqueada.', '/modulos/listar')).toMatch(/bloqueada/);
    expect(getSessionEndMessage(400, 'Usuário não encontrado ou inativo no sistema.', '/modulos/listar')).toMatch(/inativo/);
  });

  it('keeps the session on business errors and on the login request itself', () => {
    expect(getSessionEndMessage(409, 'Nao e permitido bloquear ou excluir sua propria empresa.', '/empresas/bloqueio/1')).toBeNull();
    expect(getSessionEndMessage(404, 'Empresa nao encontrada.', '/empresas/buscar/9')).toBeNull();
    expect(getSessionEndMessage(401, 'Usuário ou senha inválidos.', '/usuarios/login')).toBeNull();
  });
});
