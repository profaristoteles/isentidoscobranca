export function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`[Storage] Falha ao ler "${key}" do localStorage.`, error);
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[Storage] Falha ao salvar "${key}" no localStorage.`, error);
  }
}

export function safeRemoveItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[Storage] Falha ao remover "${key}" do localStorage.`, error);
  }
}

export function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('[Storage] JSON local inválido. Usando valor padrão.', error);
    return fallback;
  }
}
