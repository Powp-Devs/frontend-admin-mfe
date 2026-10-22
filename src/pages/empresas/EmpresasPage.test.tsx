import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import EmpresasPage from './EmpresasPage';
import { companyService } from '@/services/companyService';
import { byLabel, byText, click, openDialog, renderRoute, Rendered, rowAction, submit, type } from '@/test/render';
import { Empresa } from '@/types';

const base: Empresa = {
  codempresa: 1, empresa: 'POWP Desenvolvimento', fantasia: 'POWP Dev', cnpj: '000', schema_name: 'empresa_1',
  data_cadastro: '2026-10-14', bloqueio: 'N', motivo_bloqueio: null, obs: null, excluida: false,
};
const bloqueada: Empresa = { ...base, codempresa: 2, fantasia: 'Loja B', bloqueio: 'S', motivo_bloqueio: 'Inadimplente' };
const excluida: Empresa = { ...base, codempresa: 3, fantasia: 'Loja C', bloqueio: 'S', excluida: true };

const row = (cod: number) => document.querySelector<HTMLElement>(`[data-testid="empresa-${cod}"]`)!;
const menuItems = () => Array.from(document.querySelectorAll('[role="menuitem"]')).map((el) => el.textContent?.trim());

describe('EmpresasPage', () => {
  let r: Rendered;
  let listar: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    listar = vi
      .spyOn(companyService, 'listar')
      .mockResolvedValue({ empresas: [base, bloqueada, excluida], total: 3, page: 1, per_page: 20 });
    r = await renderRoute('/empresas', [{ path: '/empresas', element: <EmpresasPage /> }]);
  });

  afterEach(() => {
    r.unmount();
    vi.restoreAllMocks();
  });

  it('lists companies with initials, status badge and block reason', () => {
    expect(row(1).textContent).toContain('PD');
    expect(row(1).textContent).toContain('Ativa');
    expect(row(2).textContent).toContain('Bloqueada');
    expect(row(2).textContent).toContain('Inadimplente');
    expect(row(3).textContent).toContain('Excluída');
    expect(row(1).textContent).toContain('14/10/2026');
  });

  it('offers actions according to the company status', async () => {
    await click(byLabel('Ações de POWP Dev'));
    expect(menuItems()).toEqual(['Módulos', 'Editar', 'Bloquear', 'Excluir']);
  });

  it('offers only modules and restore for deleted companies', async () => {
    await click(byLabel('Ações de Loja C'));
    expect(menuItems()).toEqual(['Módulos', 'Restaurar']);
  });

  it('sends the filters to the API', async () => {
    await click(document.querySelector('input[type="checkbox"]'));
    expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ incluir_excluidas: true, page: 1 }));

    await type(byLabel('Buscar empresas'), 'loja');
    await submit(byLabel('Buscar empresas')!.closest('form'));
    expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ busca: 'loja' }));
  });

  it('blocks a company with a reason', async () => {
    const definir = vi.spyOn(companyService, 'definirBloqueio').mockResolvedValue({ ...base, bloqueio: 'S' });
    await rowAction('POWP Dev', 'Bloquear');
    await type(openDialog()!.querySelector('input'), 'Teste');
    await submit(openDialog()!.querySelector('form') ?? openDialog());
    expect(definir).toHaveBeenCalledWith(1, 'S', 'Teste');
    expect(document.body.textContent).toContain('Empresa “POWP Dev” bloqueada');
  });

  it('unblocks only after confirmation', async () => {
    const definir = vi.spyOn(companyService, 'definirBloqueio').mockResolvedValue({ ...bloqueada, bloqueio: 'N' });
    await rowAction('Loja B', 'Liberar acesso');
    expect(definir).not.toHaveBeenCalled();
    await click(byText(openDialog()!, 'button', 'Liberar acesso'));
    expect(definir).toHaveBeenCalledWith(2, 'N', undefined);
  });

  it('deletes after confirmation', async () => {
    const excluir = vi.spyOn(companyService, 'excluir').mockResolvedValue();
    await rowAction('POWP Dev', 'Excluir');
    expect(openDialog()?.textContent).toContain('dados ficam preservados');
    await click(byText(openDialog()!, 'button', 'Excluir'));
    expect(excluir).toHaveBeenCalledWith(1);
  });

  const fillCreateForm = async (senha: string) => {
    await click(byText(document.body, 'button', 'Nova empresa'));
    const inputs = openDialog()!.querySelectorAll('input');
    const values = ['Empresa X', 'X', '123', 'admin_x', 'x@x.com', senha];
    for (const [i, v] of values.entries()) await type(inputs[i], v);
    await submit(openDialog()!.closest('form') ?? openDialog()!.querySelector('form') ?? openDialog());
  };

  it('keeps the create dialog open and shows the conflict returned by the API', async () => {
    const cadastrar = vi
      .spyOn(companyService, 'cadastrar')
      .mockRejectedValue({ response: { data: { detail: 'CNPJ, login ou e-mail ja cadastrado.' } } });
    await fillCreateForm('senha-segura');
    expect(cadastrar).toHaveBeenCalledWith(
      expect.objectContaining({ empresa: 'Empresa X', administrador: { usuario: 'admin_x', email: 'x@x.com', senha: 'senha-segura' } })
    );
    expect(openDialog()?.textContent).toContain('CNPJ, login ou e-mail ja cadastrado.');
  });

  it('rejects short admin passwords before calling the API', async () => {
    const cadastrar = vi.spyOn(companyService, 'cadastrar');
    await fillCreateForm('curta');
    expect(cadastrar).not.toHaveBeenCalled();
    expect(openDialog()?.textContent).toContain('entre 8 e 72 bytes');
  });
});
