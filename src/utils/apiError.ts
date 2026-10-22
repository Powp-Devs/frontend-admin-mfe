// Mensagem legível do "detail" do FastAPI: texto, lista (validação do Pydantic)
// ou objeto (ex.: 403 MODULO_NAO_LIBERADO, com "mensagem").
export function getApiErrorMessage(err: any, fallback = 'Não foi possível concluir a operação.'): string {
  const detail = err?.response?.data?.detail;

  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg) {
          const campo = Array.isArray(item.loc) ? item.loc.filter((p: unknown) => p !== 'body').join('.') : '';
          return campo ? `${campo}: ${item.msg}` : item.msg;
        }
        return '';
      })
      .filter(Boolean)
      .join(' | ');
    if (message) return message;
  }
  if (detail && typeof detail === 'object') {
    const message = detail.mensagem || detail.message;
    if (typeof message === 'string' && message) return message;
  }
  if (!err?.response && err?.message === 'Network Error') {
    return 'Não foi possível conectar à API. Verifique se o backend está em execução.';
  }
  return fallback;
}
