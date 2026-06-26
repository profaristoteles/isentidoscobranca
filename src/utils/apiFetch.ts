export function installApiAuthFetch() {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    const isSameOriginApi = url.startsWith('/api') || url.startsWith(window.location.origin + '/api');
    if (!isSameOriginApi || url.endsWith('/api/login')) {
      return nativeFetch(input, init);
    }

    const token = window.localStorage.getItem('sentidos_auth_token');
    if (!token) {
      return nativeFetch(input, init);
    }

    const headers = new Headers(init.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await nativeFetch(input, { ...init, headers });
    if (response.status === 401) {
      window.localStorage.removeItem('sentidos_auth_token');
      window.localStorage.removeItem('sentidos_user_email');
      if (!window.location.pathname.includes('/login')) {
        window.location.reload();
      }
    }
    return response;
  };
}
