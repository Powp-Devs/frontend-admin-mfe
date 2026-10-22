// Sessão do painel. Fica separada do authService para o api.ts usar sem import circular.

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';
const SESSION_END_MESSAGE_KEY = 'admin_session_end_message';

// Mensagens exatas do backend (app/core/security.py e app/core/tenancy.py).
const BACKEND_EMPRESA_BLOQUEADA = 'Empresa bloqueada.';
const BACKEND_USUARIO_INATIVO = 'Usuário não encontrado ou inativo no sistema.';
const BACKEND_SEM_PERMISSAO_GLOBAL = 'Administrador da plataforma necessario.';

const LOGIN_URL = '/usuarios/login';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export function saveSession(token: string, user: unknown): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Decide se uma resposta de erro encerra a sessão do painel.
 * null: erro da tela; '': encerra sem mensagem; texto: encerra exibindo o motivo no login.
 */
export function getSessionEndMessage(status: number | undefined, detail: unknown, url?: string): string | null {
  if (url?.endsWith(LOGIN_URL)) return null;

  if (status === 401) return 'Sua sessão expirou ou foi encerrada. Entre novamente.';
  if (status === 403 && detail === BACKEND_SEM_PERMISSAO_GLOBAL) {
    return 'Seu usuário não é mais administrador da plataforma.';
  }
  if (status === 403 && detail === BACKEND_EMPRESA_BLOQUEADA) {
    return 'A empresa do seu usuário está bloqueada.';
  }
  if (status === 400 && detail === BACKEND_USUARIO_INATIVO) {
    return 'Seu usuário está inativo.';
  }
  return null;
}

export function storeSessionEndMessage(message: string): void {
  if (message) sessionStorage.setItem(SESSION_END_MESSAGE_KEY, message);
}

export function consumeSessionEndMessage(): string | null {
  const message = sessionStorage.getItem(SESSION_END_MESSAGE_KEY);
  sessionStorage.removeItem(SESSION_END_MESSAGE_KEY);
  return message;
}
