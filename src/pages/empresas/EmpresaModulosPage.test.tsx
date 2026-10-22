import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import EmpresaModulosPage from './EmpresaModulosPage';
import { companyService } from '@/services/companyService';
import { moduleService } from '@/services/moduleService';
import { byLabel, byText, click, moduloDaEmpresa, openDialog, renderRoute, Rendered } from '@/test/render';
import { Empresa, EmpresaModulo } from '@/types';

const empresa: Empresa = {
  codempresa: 2, empresa: 'Empresa B Ltda', fantasia: 'Empresa B', cnpj: '1', schema_name: 'empresa_2',
  data_cadastro: '2026-10-21', bloqueio: 'N', motivo_bloqueio: null, obs: null, excluida: false,
};

const lista: EmpresaModulo[] = [
  moduloDaEmpresa('categorias', { ativo_empresa: 'S', acesso_permitido: true, modulos_pendentes: [], alterado_por: 1, data_alteracao: '2026-10-21T10:00:00Z' }),
  moduloDaEmpresa('fornecedores'),
  moduloDaEmpresa('produtos', { modulos_pendentes: ['fornecedores', 'produtos'] }),
];

const row = (chave: string) => document.querySelector<HTMLElement>(`[data-testid="modulo-${chave}"]`)!;

describe('EmpresaModulosPage', () => {
  let r: Rendered;
  let definir: ReturnType<typeof vi.spyOn>;

  const render = async (empresaData = empresa) => {
    vi.spyOn(companyService, 'buscar').mockResolvedValue(empresaData);
    vi.spyOn(moduleService, 'listarDaEmpresa').mockResolvedValue(lista);
    definir = vi.spyOn(moduleService, 'definirLiberacao').mockResolvedValue(lista[0]);
    r = await renderRoute('/empresas/2/modulos', [{ path: '/empresas/:codempresa/modulos', element: <EmpresaModulosPage /> }]);
  };

  afterEach(() => {
    r.unmount();
    vi.restoreAllMocks();
  });

  describe('com a empresa ativa', () => {
    beforeEach(() => render());

    it('shows the summary, link state, effective access and pending dependencies', () => {
      expect(document.body.textContent).toContain('Com acesso efetivo1 de 3');
      expect(row('produtos').textContent).toContain('Não liberado');
      expect(row('produtos').textContent).toContain('Pendentes: Fornecedores');
      expect(row('categorias').textContent).toContain('Liberado');
      expect(row('categorias').textContent).toContain('usuário #1');
    });

    it('grants a module together with its missing dependencies, in order', async () => {
      await click(byText(row('produtos'), 'button', 'Liberar com dependências'));
      expect(definir.mock.calls.map((c: unknown[]) => c.slice(1))).toEqual([
        ['produtos', 'S'],
        ['fornecedores', 'S'],
      ]);
      expect(document.body.textContent).toContain('Liberados: Produtos, Fornecedores.');
    });

    it('grants only the module itself with the switch', async () => {
      await click(byLabel('Liberação de Produtos'));
      expect(definir).toHaveBeenCalledTimes(1);
      expect(definir).toHaveBeenCalledWith(2, 'produtos', 'S');
    });

    it('asks for confirmation before revoking', async () => {
      await click(byLabel('Liberação de Categorias'));
      expect(definir).not.toHaveBeenCalled();
      expect(openDialog()?.textContent).toContain('Bloquear “Categorias”');

      await click(byText(openDialog()!, 'button', 'Bloquear módulo'));
      expect(definir).toHaveBeenCalledWith(2, 'categorias', 'N');
    });

    it('grants every module not granted yet after confirmation', async () => {
      await click(byText(document.body, 'button', 'Liberar todos'));
      await click(byText(openDialog()!, 'button', 'Liberar todos'));
      expect(definir.mock.calls.map((c: unknown[]) => c[1])).toEqual(['fornecedores', 'produtos']);
    });

    it('shows the backend error and reloads the real state after a failure', async () => {
      definir.mockRejectedValue({ response: { data: { detail: 'Modulo nao encontrado.' } } });
      const recarregar = vi.mocked(moduleService.listarDaEmpresa);
      const antes = recarregar.mock.calls.length;
      await click(byLabel('Liberação de Fornecedores'));
      expect(document.body.textContent).toContain('Modulo nao encontrado.');
      expect(recarregar.mock.calls.length).toBeGreaterThan(antes);
    });
  });

  it('warns that a blocked company has no effective access', async () => {
    await render({ ...empresa, bloqueio: 'S' });
    expect(document.body.textContent).toContain('A empresa está bloqueada');
  });
});
