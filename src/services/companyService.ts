import { api } from './api';
import { Empresa, EmpresaCreate, EmpresaFiltros, EmpresaPage, EmpresaUpdate, SimNao } from '@/types';

export const companyService = {
  async listar(filtros: EmpresaFiltros): Promise<EmpresaPage> {
    const params = {
      page: filtros.page,
      per_page: filtros.per_page,
      busca: filtros.busca?.trim() || undefined,
      bloqueio: filtros.bloqueio || undefined,
      incluir_excluidas: filtros.incluir_excluidas || undefined,
    };
    const { data } = await api.get<EmpresaPage>('/empresas/listar', { params });
    return data;
  },

  async buscar(codempresa: number): Promise<Empresa> {
    const { data } = await api.get<Empresa>(`/empresas/buscar/${codempresa}`, {
      params: { incluir_excluidas: true },
    });
    return data;
  },

  async cadastrar(empresa: EmpresaCreate): Promise<Empresa> {
    const { data } = await api.post<Empresa>('/empresas/cadastrar', empresa);
    return data;
  },

  async atualizar(codempresa: number, campos: EmpresaUpdate): Promise<Empresa> {
    const { data } = await api.patch<Empresa>(`/empresas/atualizar/${codempresa}`, campos);
    return data;
  },

  async definirBloqueio(codempresa: number, bloqueio: SimNao, motivo?: string): Promise<Empresa> {
    const { data } = await api.patch<Empresa>(`/empresas/bloqueio/${codempresa}`, {
      bloqueio,
      ...(bloqueio === 'S' && motivo?.trim() ? { motivo: motivo.trim() } : {}),
    });
    return data;
  },

  // Exclusão lógica: bloqueia o acesso e preserva schema e dados.
  async excluir(codempresa: number): Promise<void> {
    await api.delete(`/empresas/excluir/${codempresa}`);
  },

  // Restaurar não libera o bloqueio; é preciso liberar em seguida.
  async restaurar(codempresa: number): Promise<Empresa> {
    const { data } = await api.post<Empresa>(`/empresas/restaurar/${codempresa}`);
    return data;
  },
};
