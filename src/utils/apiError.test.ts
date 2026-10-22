import { describe, it, expect } from 'vitest';
import { getApiErrorMessage } from './apiError';

const err = (detail: unknown) => ({ response: { data: { detail } } });

describe('getApiErrorMessage', () => {
  it('returns string details (e.g. 409 conflicts)', () => {
    expect(getApiErrorMessage(err('CNPJ, login ou e-mail ja cadastrado.'))).toBe('CNPJ, login ou e-mail ja cadastrado.');
  });

  it('prefixes Pydantic errors with the field path', () => {
    const detail = [{ loc: ['body', 'administrador', 'senha'], msg: 'Value error, Senha deve ter entre 8 e 72 bytes' }];
    expect(getApiErrorMessage(err(detail))).toBe('administrador.senha: Value error, Senha deve ter entre 8 e 72 bytes');
  });

  it('uses "mensagem" from object details', () => {
    expect(getApiErrorMessage(err({ codigo: 'MODULO_NAO_LIBERADO', mensagem: 'Nao liberado.' }))).toBe('Nao liberado.');
  });

  it('explains network failures and falls back otherwise', () => {
    expect(getApiErrorMessage({ message: 'Network Error' })).toMatch(/conectar à API/);
    expect(getApiErrorMessage(err({}), 'padrão')).toBe('padrão');
  });
});
