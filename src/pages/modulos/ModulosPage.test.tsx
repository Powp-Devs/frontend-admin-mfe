import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import ModulosPage from './ModulosPage';
import { moduleService } from '@/services/moduleService';
import { byText, click, openDialog, renderRoute, Rendered, rowAction, submit, type } from '@/test/render';
import { Modulo } from '@/types';

const estoque: Modulo = {
  codmodulo: 7, chave: 'estoque', modulo: 'Estoque', descricao: 'Modulo de Estoque', ativo: 'S', exibir_modulo: 'S',
  data_criacao: '2026-10-21T00:00:00Z',
};

const dialogs = () => Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]'));
const formDialog = () => dialogs().find((d) => d.querySelector('input'))!;

describe('ModulosPage', () => {
  let r: Rendered;

  beforeEach(async () => {
    vi.spyOn(moduleService, 'listarCatalogo').mockResolvedValue({ modulos: [estoque], total: 1, page: 1, per_page: 50 });
    r = await renderRoute('/modulos', [{ path: '/modulos', element: <ModulosPage /> }]);
  });

  afterEach(() => {
    r.unmount();
    vi.restoreAllMocks();
  });

  it('lists the catalog with status and menu visibility', () => {
    const row = document.querySelector('[data-testid="catalogo-estoque"]')!;
    expect(row.textContent).toContain('Ativo');
    expect(row.textContent).toContain('Exibido');
  });

  it('validates the key before creating a module', async () => {
    const cadastrar = vi.spyOn(moduleService, 'cadastrar');
    await click(byText(document.body, 'button', 'Novo módulo'));
    const inputs = formDialog().querySelectorAll('input');
    await type(inputs[0], 'Relatórios');
    await type(inputs[1], 'Relatórios');
    await type(inputs[2], 'Relatórios extras');
    await submit(formDialog());
    expect(cadastrar).not.toHaveBeenCalled();
    expect(formDialog().textContent).toContain('A chave deve começar com letra minúscula');
  });

  it('asks for confirmation before deactivating a module for every company', async () => {
    const atualizar = vi.spyOn(moduleService, 'atualizar').mockResolvedValue({ ...estoque, ativo: 'N' });
    await rowAction('Estoque', 'Editar');
    const ativo = formDialog().querySelector<HTMLSelectElement>('select[aria-label="Ativo no catálogo"]')!;
    await act(async () => {
      ativo.value = 'N';
      ativo.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await submit(formDialog());
    expect(atualizar).not.toHaveBeenCalled();

    const confirm = dialogs().find((d) => d.textContent?.includes('TODAS as empresas'))!;
    await click(byText(confirm, 'button', 'Desativar'));
    expect(atualizar).toHaveBeenCalledWith('estoque', { ativo: 'N' });
  });

  it('sends only the changed fields when editing', async () => {
    const atualizar = vi.spyOn(moduleService, 'atualizar').mockResolvedValue(estoque);
    await rowAction('Estoque', 'Editar');
    await type(formDialog().querySelectorAll('input')[2], 'Controle de estoque');
    await submit(formDialog());
    expect(atualizar).toHaveBeenCalledWith('estoque', { descricao: 'Controle de estoque' });
  });
});
