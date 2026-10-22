import { api } from './api';
import { EmpresaModulo, Modulo, ModuloCreate, ModuloPage, ModuloUpdate, SimNao } from '@/types';

export const moduleService = {
  async listarCatalogo(page: number, perPage: number): Promise<ModuloPage> {
    const { data } = await api.get<ModuloPage>('/modulos/listar', { params: { page, per_page: perPage } });
    return data;
  },

  async cadastrar(modulo: ModuloCreate): Promise<Modulo> {
    const { data } = await api.post<Modulo>('/modulos/cadastrar', modulo);
    return data;
  },

  // A chave não pode ser alterada.
  async atualizar(chave: string, campos: ModuloUpdate): Promise<Modulo> {
    const { data } = await api.patch<Modulo>(`/modulos/atualizar/${chave}`, campos);
    return data;
  },

  // Todos os módulos do catálogo, inclusive os não liberados para a empresa.
  async listarDaEmpresa(codempresa: number): Promise<EmpresaModulo[]> {
    const { data } = await api.get<EmpresaModulo[]>(`/empresas/${codempresa}/modulos`);
    return data;
  },

  // Cria ou atualiza o vínculo empresa/módulo. Não libera dependências automaticamente.
  async definirLiberacao(codempresa: number, chave: string, ativo: SimNao): Promise<EmpresaModulo> {
    const { data } = await api.put<EmpresaModulo>(`/empresas/${codempresa}/modulos/${chave}`, { ativo });
    return data;
  },
};
