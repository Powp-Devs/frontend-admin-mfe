import { describe, it, expect } from 'vitest';
import { globallyInactiveDependencies, keysToGrant, pendingLabel } from './modules';
import { moduloDaEmpresa } from '@/test/render';

// Cenário: estoque -> produtos -> (categorias, fornecedores); categorias já liberada.
const lista = [
  moduloDaEmpresa('categorias', { ativo_empresa: 'S', acesso_permitido: true, modulos_pendentes: [] }),
  moduloDaEmpresa('fornecedores'),
  moduloDaEmpresa('produtos', { modulos_pendentes: ['fornecedores', 'produtos'] }),
  moduloDaEmpresa('estoque', { modulos_pendentes: ['estoque', 'fornecedores', 'produtos'] }),
];
const estoque = lista[3];

describe('keysToGrant', () => {
  it('returns the module and pending dependencies that are not granted yet', () => {
    expect(keysToGrant(estoque, lista).sort()).toEqual(['estoque', 'fornecedores', 'produtos']);
  });

  it('skips dependencies already granted (pending only for another reason)', () => {
    const comVinculo = lista.map((m) => (m.chave === 'fornecedores' ? { ...m, ativo_empresa: 'S' as const } : m));
    expect(keysToGrant(estoque, comVinculo).sort()).toEqual(['estoque', 'produtos']);
  });

  it('returns only the module itself when it has no dependency', () => {
    expect(keysToGrant(lista[1], lista)).toEqual(['fornecedores']);
  });
});

describe('globallyInactiveDependencies', () => {
  it('lists pending modules disabled in the catalog', () => {
    const inativo = lista.map((m) => (m.chave === 'produtos' ? { ...m, ativo: 'N' as const } : m));
    expect(globallyInactiveDependencies(estoque, inativo)).toEqual(['produtos']);
    expect(globallyInactiveDependencies(estoque, lista)).toEqual([]);
  });
});

describe('pendingLabel', () => {
  it('names pending dependencies without the module itself', () => {
    expect(pendingLabel(estoque, lista)).toBe('Fornecedores, Produtos');
    expect(pendingLabel(lista[0], lista)).toBe('');
  });
});
