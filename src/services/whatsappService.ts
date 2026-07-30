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
  return settings.instanceToken.trim() || settings.globalToken.trim();
}

export function sanitizePhoneNumber(numStr: string): string {
  const cleaned = numStr.replace(/\D/g, '');
  if (cleaned.length === 0) return '';

  if (cleaned.length >= 10 && cleaned.length <= 11 && !cleaned.startsWith('55')) {
    return '55' + cleaned;
  }
  return cleaned;
}

export async function checkConnectionStatus(): Promise<{ connected: boolean; state: string; details?: any }> {
  try {
    const response = await fetch('/api/whatsapp/status');
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`Evolution API Connection check error (HTTP ${response.status}):`, data);
      return { connected: false, state: data.state || 'ERROR', details: data.message || data };
    }

    return { connected: !!data.connected, state: data.state || 'close', details: data.details || data };
  } catch (error: any) {
    console.error('Failed to contact Evolution API connectionState:', error);
    return { connected: false, state: 'OFFLINE', details: error.message || error };
  }
}

export async function getQrCode(): Promise<{ qrCode?: string; connected: boolean; message?: string }> {
  try {
    const response = await fetch('/api/whatsapp/qr');
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Erro HTTP ${response.status}`);
    }

    return {
      qrCode: data.qrCode,
      connected: !!data.connected,
      message: data.message || (data.qrCode ? 'QR Code gerado.' : 'QR Code não gerado. Verifique os logs da API.')
    };
  } catch (error: any) {
    console.error('Failed to get QR Code from Evolution API:', error);
    throw error;
  }
}

export async function sendTextMessage(numberStr: string, text: string): Promise<any> {
  const sanitizedNumber = sanitizePhoneNumber(numberStr);
  if (!sanitizedNumber) {
    throw new Error('Número de telefone inválido ou vazio.');
  }

  const settings = getEvolutionSettings();

  try {
    const response = await fetch('/api/whatsapp/send-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: sanitizedNumber,
        text,
        evolutionConfig: settings.url ? settings : undefined
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || `Erro HTTP ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('Failed to send text message via Evolution API:', error);
    throw error;
  }
}

export async function logoutInstance(): Promise<boolean> {
  try {
    const response = await fetch('/api/whatsapp/logout', { method: 'DELETE' });

    if (response.ok) {
      return true;
    }
    const data = await response.json().catch(() => ({}));
    console.warn('Evolution API logout issue:', data);
    return false;
  } catch (error) {
    console.error('Failed to logout instance in Evolution API:', error);
    return false;
  }
}
