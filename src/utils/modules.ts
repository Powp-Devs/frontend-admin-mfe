import { EmpresaModulo } from '@/types';

// O backend calcula modulos_pendentes = (o módulo + dependências transitivas) que
// não têm acesso efetivo. As regras ficam em app/core/modules.py; aqui só usamos o resultado.

/** Chaves que precisam receber liberação (PUT ativo=S) para o módulo funcionar. */
export function keysToGrant(modulo: EmpresaModulo, todos: EmpresaModulo[]): string[] {
  const porChave = new Map(todos.map((m) => [m.chave, m]));
  const necessarias = new Set([modulo.chave, ...modulo.modulos_pendentes]);
  return [...necessarias].filter((chave) => porChave.get(chave)?.ativo_empresa !== 'S');
}

/** Dependências desativadas no catálogo: liberar a empresa não resolve. */
export function globallyInactiveDependencies(modulo: EmpresaModulo, todos: EmpresaModulo[]): string[] {
  const porChave = new Map(todos.map((m) => [m.chave, m]));
  return [modulo.chave, ...modulo.modulos_pendentes].filter((chave) => porChave.get(chave)?.ativo === 'N');
}

/** Nomes das dependências pendentes (sem o próprio módulo), para exibir na tabela. */
export function pendingLabel(modulo: EmpresaModulo, todos: EmpresaModulo[]): string {
  const nomes = new Map(todos.map((m) => [m.chave, m.modulo]));
  return modulo.modulos_pendentes
    .filter((chave) => chave !== modulo.chave)
    .map((chave) => nomes.get(chave) ?? chave)
    .join(', ');
}
