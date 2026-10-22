import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { AppRouter } from './AppRouter';
import { api } from '@/services/api';
import { companyService } from '@/services/companyService';
import { byText, flush, renderRoute, Rendered } from '@/test/render';

const setValue = (input: Element, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('AppRouter', () => {
  let r: Rendered;

  afterEach(() => {
    r.unmount();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sends unauthenticated visitors to login', async () => {
    r = await renderRoute('/empresas', [{ path: '*', element: <AppRouter /> }]);
    expect(r.container.textContent).toContain('Acesso restrito a administradores da plataforma');
  });

  it('refuses users that are not platform admins', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({
      data: { access_token: 't', token_type: 'bearer', user: { usuario: 'usuario.comum', admin_plataforma: false } },
    });
    r = await renderRoute('/login', [{ path: '*', element: <AppRouter /> }]);
    const [usuario, senha] = Array.from(r.container.querySelectorAll('input'));
    await act(async () => {
      setValue(usuario, 'usuario.comum');
      setValue(senha, 'comum123');
    });
    await act(async () => r.container.querySelector('form')!.requestSubmit());
    await flush();
    expect(r.container.textContent).toContain('Este usuário não é administrador da plataforma.');
    expect(localStorage.getItem('admin_token')).toBeNull();
  });

  it('opens the companies page for an authenticated platform admin', async () => {
    localStorage.setItem('admin_token', 't');
    localStorage.setItem('admin_user', JSON.stringify({ usuario: 'admin', nome: 'Admin', admin_plataforma: true }));
    vi.spyOn(companyService, 'listar').mockResolvedValue({ empresas: [], total: 0, page: 1, per_page: 20 });
    r = await renderRoute('/', [{ path: '*', element: <AppRouter /> }]);
    expect(byText(r.container, 'h1', 'Empresas')).toBeDefined();
    expect(r.container.textContent).toContain('Nenhuma empresa encontrada.');
  });
});
