import { GoogleGenAI } from '@google/genai/web';

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'openrouter';

export interface AISettings {
  provider: AIProvider;
  geminiKey: string;
  openaiKey: string;
  openaiModel: string;
  groqKey: string;
  groqModel: string;
  openrouterKey: string;
  openrouterModel: string;
}

export function getAISettings(): AISettings {
  return {
    provider: (localStorage.getItem('sentidos_ai_provider') as AIProvider) || 'gemini',
    geminiKey: localStorage.getItem('sentidos_gemini_api_key') || '',
    openaiKey: localStorage.getItem('sentidos_openai_api_key') || '',
    openaiModel: localStorage.getItem('sentidos_openai_model') || 'gpt-4o-mini',
    groqKey: localStorage.getItem('sentidos_groq_api_key') || '',
    groqModel: localStorage.getItem('sentidos_groq_model') || 'llama-3.3-70b-specdec',
    openrouterKey: localStorage.getItem('sentidos_openrouter_api_key') || '',
    openrouterModel: localStorage.getItem('sentidos_openrouter_model') || 'google/gemini-2.5-flash',
  };
}

export function getActiveApiKey(): string {
  const s = getAISettings();
  switch (s.provider) {
    case 'gemini': return s.geminiKey;
    case 'openai': return s.openaiKey;
    case 'groq': return s.groqKey;
    case 'openrouter': return s.openrouterKey;
  }
}

// In-browser PDF text extractor using CDN-based PDF.js
export async function extractTextFromPdf(base64: string): Promise<string> {
  const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
  if (!pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar o motor PDF.js via CDN'));
      document.head.appendChild(script);
    });
  }

  const pdfjs = (window as any)['pdfjs-dist/build/pdf'];
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

export async function generateTextWithActiveAI(
  prompt: string,
  systemInstruction?: string,
  file?: { base64: string; mimeType: string }
): Promise<string> {
  const settings = getAISettings();
  const activeKey = getActiveApiKey();

  // If no API Key is configured for the active provider, throw error to trigger simulation fallback
  if (!activeKey) {
    throw new Error('Nenhuma chave de API configurada para o provedor selecionado.');
  }

  switch (settings.provider) {
    case 'gemini': {
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const contents: any[] = [];
      if (file) {
        contents.push({
          inlineData: {
            data: file.base64,
            mimeType: file.mimeType
          }
        });
      }
      contents.push(prompt);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: systemInstruction ? { systemInstruction } : undefined
      });
      return response.text?.trim() || '';
    }

    case 'openai': {
      let finalPrompt = prompt;
      if (file) {
        if (file.mimeType.includes('pdf')) {
          const extractedText = await extractTextFromPdf(file.base64);
          finalPrompt = `${prompt}\n\n[CONTEÚDO DO DOCUMENTO EXTRAÍDO POR OCR CLIENT-SIDE]:\n${extractedText}`;
        } else if (file.mimeType.includes('text') || file.mimeType.includes('plain')) {
          const decoded = atob(file.base64);
          finalPrompt = `${prompt}\n\n[CONTEÚDO DO ARQUIVO DE TEXTO]:\n${decoded}`;
        }
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model: settings.openaiModel || 'gpt-4o-mini',
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: finalPrompt }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro da API OpenAI (HTTP ${response.status})`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    }

    case 'groq': {
      let finalPrompt = prompt;
      if (file) {
        if (file.mimeType.includes('pdf')) {
          const extractedText = await extractTextFromPdf(file.base64);
          finalPrompt = `${prompt}\n\n[CONTEÚDO DO DOCUMENTO EXTRAÍDO POR OCR CLIENT-SIDE]:\n${extractedText}`;
        } else if (file.mimeType.includes('text') || file.mimeType.includes('plain')) {
          const decoded = atob(file.base64);
          finalPrompt = `${prompt}\n\n[CONTEÚDO DO ARQUIVO DE TEXTO]:\n${decoded}`;
        }
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model: settings.groqModel || 'llama-3.3-70b-specdec',
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: finalPrompt }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro da API Groq (HTTP ${response.status})`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    }

    case 'openrouter': {
      let finalPrompt = prompt;
      if (file) {
        if (file.mimeType.includes('pdf')) {
          const extractedText = await extractTextFromPdf(file.base64);
          finalPrompt = `${prompt}\n\n[CONTEÚDO DO DOCUMENTO EXTRAÍDO POR OCR CLIENT-SIDE]:\n${extractedText}`;
        } else if (file.mimeType.includes('text') || file.mimeType.includes('plain')) {
          const decoded = atob(file.base64);
          finalPrompt = `${prompt}\n\n[CONTEÚDO DO ARQUIVO DE TEXTO]:\n${decoded}`;
        }
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Sentidos Cobranças'
        },
        body: JSON.stringify({
          model: settings.openrouterModel || 'google/gemini-2.5-flash',
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: finalPrompt }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro da API OpenRouter (HTTP ${response.status})`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    }

    default:
      throw new Error('Provedor de IA desconhecido.');
  }
}
