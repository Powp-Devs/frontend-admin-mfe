// Contratos de backEnd-python: admin/users (login), admin/companies e admin/modulos.

export type SimNao = 'S' | 'N';

export interface AuthUser {
  nome?: string;
  usuario: string;
  email?: string;
  codusuario?: number;
  codempresa?: number;
  admin_empresa?: boolean;
  admin_plataforma?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: AuthUser;
}

// EmpresaResponse
export interface Empresa {
  codempresa: number;
  empresa: string;
  fantasia: string;
  cnpj: string;
  schema_name: string;
  data_cadastro: string;
  bloqueio: SimNao;
  motivo_bloqueio: string | null;
  obs: string | null;
  excluida: boolean;
}

export interface EmpresaPage {
  empresas: Empresa[];
  total: number;
  page: number;
  per_page: number;
}

export interface EmpresaFiltros {
  page: number;
  per_page: number;
  busca?: string;
  bloqueio?: SimNao;
  incluir_excluidas?: boolean;
}

// EmpresaCreate
export interface EmpresaCreate {
  empresa: string;
  fantasia: string;
  cnpj: string;
  obs?: string | null;
  administrador: {
    usuario: string;
    email: string;
    senha: string;
  };
}

// EmpresaUpdate: só os campos enviados são alterados; apenas obs aceita null
export interface EmpresaUpdate {
  empresa?: string;
  fantasia?: string;
  cnpj?: string;
  obs?: string | null;
}

// ModuloResponse
export interface Modulo {
  codmodulo: number;
  chave: string;
  modulo: string;
  descricao: string;
  ativo: SimNao;
  exibir_modulo: SimNao;
  data_criacao: string;
}

export interface ModuloPage {
  modulos: Modulo[];
  total: number;
  page: number;
  per_page: number;
}

export interface ModuloCreate {
  chave: string;
  modulo: string;
  descricao: string;
  ativo: SimNao;
  exibir_modulo: SimNao;
}

export type ModuloUpdate = Partial<Omit<ModuloCreate, 'chave'>>;

// EmpresaModuloResponse
export interface EmpresaModulo extends Modulo {
  ativo_empresa: SimNao;
  acesso_permitido: boolean;
  modulos_pendentes: string[];
  alterado_por: number | null;
  data_alteracao: string | null;
}
