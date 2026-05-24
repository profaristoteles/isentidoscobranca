import { safeGetItem } from '../utils/storage';

export interface EvolutionSettings {
  url: string;
  globalToken: string;
  instanceName: string;
  instanceToken: string;
}

export function getEvolutionSettings(): EvolutionSettings {
  return {
    url: safeGetItem('sentidos_evolution_url') || '',
    globalToken: safeGetItem('sentidos_evolution_global_token') || '',
    instanceName: safeGetItem('sentidos_evolution_instance') || '',
    instanceToken: safeGetItem('sentidos_evolution_instance_token') || '',
  };
}

export function isEvolutionConfigured(): boolean {
  const settings = getEvolutionSettings();
  return !!(settings.url && settings.instanceName);
}

export function getActiveApiKey(): string {
  const settings = getEvolutionSettings();
  // Prioritize Instance Token, fallback to Global Token
  return settings.instanceToken.trim() || settings.globalToken.trim();
}

export function sanitizePhoneNumber(numStr: string): string {
  const cleaned = numStr.replace(/\D/g, ''); // keep only digits
  if (cleaned.length === 0) return '';
  
  // If it's a Brazilian number and doesn't start with 55
  if (cleaned.length >= 10 && cleaned.length <= 11 && !cleaned.startsWith('55')) {
    return '55' + cleaned;
  }
  return cleaned;
}

// Helper function to fetch through backend proxy to avoid browser CORS issues
async function fetchWithProxy(url: string, options: any = {}): Promise<Response> {
  try {
    let parsedBody = undefined;
    if (options.body) {
      if (typeof options.body === 'string') {
        try {
          parsedBody = JSON.parse(options.body);
        } catch {
          parsedBody = options.body;
        }
      } else {
        parsedBody = options.body;
      }
    }

    const proxyResponse = await fetch('/api/whatsapp/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        body: parsedBody
      })
    });

    // If backend proxy is not found (404), is offline or returns server error, throw to fall back
    if (proxyResponse.status === 404 || proxyResponse.status === 502 || proxyResponse.status === 504) {
      throw new Error('Proxy offline');
    }

    return proxyResponse;
  } catch (error) {
    console.warn('Backend proxy failed or offline, falling back to direct fetch...', error);
    return fetch(url, options);
  }
}

// Check instance connection state
export async function checkConnectionStatus(): Promise<{ connected: boolean; state: string; details?: any }> {
  const settings = getEvolutionSettings();
  if (!isEvolutionConfigured()) {
    return { connected: false, state: 'DISCONFIGURED' };
  }

  const baseUrl = settings.url.replace(/\/$/, ''); // strip trailing slash
  const activeKey = getActiveApiKey();
  const endpoint = `${baseUrl}/instance/connectionState/${settings.instanceName}`;

  try {
    const response = await fetchWithProxy(endpoint, {
      method: 'GET',
      headers: {
        'apikey': activeKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Evolution API Connection check error (HTTP ${response.status}):`, errText);
      return { connected: false, state: 'ERROR', details: `HTTP ${response.status}` };
    }

    const data = await response.json();
    // Evolution API response structure: data.instance.state (e.g. "open", "close", "connecting")
    const state = data?.instance?.state || data?.state || 'close';
    const connected = state === 'open';
    return { connected, state, details: data };
  } catch (error: any) {
    console.error('Failed to contact Evolution API connectionState:', error);
    return { connected: false, state: 'OFFLINE', details: error.message || error };
  }
}

// Fetch QR Code or connection status
export async function getQrCode(): Promise<{ qrCode?: string; connected: boolean; message?: string }> {
  const settings = getEvolutionSettings();
  if (!isEvolutionConfigured()) {
    throw new Error('Evolution API não está configurada.');
  }

  const baseUrl = settings.url.replace(/\/$/, '');
  const activeKey = getActiveApiKey();
  const endpoint = `${baseUrl}/instance/connect/${settings.instanceName}`;

  try {
    const response = await fetchWithProxy(endpoint, {
      method: 'GET',
      headers: {
        'apikey': activeKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Erro HTTP ${response.status}`);
    }

    // Evolution API connect endpoint returns base64 string under data.base64 or data.code
    // Sometimes it directly informs if it's already connected
    if (data.base64) {
      return { qrCode: data.base64, connected: false };
    } else if (data.code) {
      return { qrCode: data.code, connected: false };
    } else if (data.instance?.state === 'open' || data.state === 'open' || data.message === 'Instance already connected') {
      return { connected: true, message: data.message || 'Instância já está conectada.' };
    }

    return { connected: false, message: 'QR Code não gerado. Verifique os logs da API.' };
  } catch (error: any) {
    console.error('Failed to get QR Code from Evolution API:', error);
    throw error;
  }
}

// Send Text Message
export async function sendTextMessage(numberStr: string, text: string): Promise<any> {
  const settings = getEvolutionSettings();
  if (!isEvolutionConfigured()) {
    throw new Error('Evolution API não está configurada.');
  }

  const sanitizedNumber = sanitizePhoneNumber(numberStr);
  if (!sanitizedNumber) {
    throw new Error('Número de telefone inválido ou vazio.');
  }

  const baseUrl = settings.url.replace(/\/$/, '');
  const activeKey = getActiveApiKey();
  const endpoint = `${baseUrl}/message/sendText/${settings.instanceName}`;

  const payload = {
    number: sanitizedNumber,
    options: {
      delay: 1200,
      presence: 'composing',
      linkPreview: true
    },
    textMessage: {
      text: text
    }
  };

  try {
    const response = await fetchWithProxy(endpoint, {
      method: 'POST',
      headers: {
        'apikey': activeKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Erro HTTP ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('Failed to send text message via Evolution API:', error);
    throw error;
  }
}

// Logout / Disconnect instance
export async function logoutInstance(): Promise<boolean> {
  const settings = getEvolutionSettings();
  if (!isEvolutionConfigured()) {
    return false;
  }

  const baseUrl = settings.url.replace(/\/$/, '');
  const activeKey = getActiveApiKey();
  const endpoint = `${baseUrl}/instance/logout/${settings.instanceName}`;

  try {
    const response = await fetchWithProxy(endpoint, {
      method: 'DELETE',
      headers: {
        'apikey': activeKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return true;
    }
    const data = await response.json();
    console.warn('Evolution API logout issue:', data);
    return false;
  } catch (error) {
    console.error('Failed to logout instance in Evolution API:', error);
    return false;
  }
}
