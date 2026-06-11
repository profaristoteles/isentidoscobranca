import React, { useState, useEffect } from 'react';
import {
  QrCode,
  RefreshCw,
  SmartphoneNfc,
  Terminal,
  User,
  Users,
  Upload,
  Send,
  MessageSquare,
  Zap,
  PowerOff
} from 'lucide-react';
import { Aluno, WhatsAppMensagem } from '../types';
import { generateTextWithActiveAI, getAISettings } from '../services/aiService';
import {
  isEvolutionConfigured,
  checkConnectionStatus,
  getQrCode,
  logoutInstance,
  getEvolutionSettings
} from '../services/whatsappService';

interface WhatsAppViewProps {
  alunos: Aluno[];
  mensagens: WhatsAppMensagem[];
  onSendMessage: (alunoId: string, txt: string, tipo: 'SISTEMA' | 'HUMANO_AGENTE' | 'HUMANO_CLIENTE') => void;
  whatsappOnline: boolean;
  onSetWhatsappOnline: (status: boolean) => void;
  onPostAlert: (msg: string, type: 'success' | 'warning' | 'error') => void;
  onSetTab: (tab: string) => void;
}

export default function WhatsAppView({
  alunos,
  mensagens,
  onSendMessage,
  whatsappOnline,
  onSetWhatsappOnline,
  onPostAlert,
  onSetTab
}: WhatsAppViewProps) {
  const [selectedChatStudentId, setSelectedChatStudentId] = useState<string>(alunos[1]?.id || alunos[0]?.id || '');
  const [textInput, setTextInput] = useState('');
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Choose who to send as: true = Operator (Agent), false = Student (Client)
  const [sendAsAgent, setSendAsAgent] = useState<boolean>(true);

  // Track human takeover list
  const [humanTakeoverList, setHumanTakeoverList] = useState<string[]>(['student-2']); // default student-2 Ricardo is human-led

  const [realQrCode, setRealQrCode] = useState<string>('');
  const [loadingQrCode, setLoadingQrCode] = useState<boolean>(false);

  // Sync selectedChatStudentId when alunos list changes (e.g., after PostgreSQL data loads,
  // after clear-db or after new students are added). This prevents stale student IDs from
  // breaking the chat view with mock/old data IDs that no longer exist in the real database.
  useEffect(() => {
    if (alunos.length > 0) {
      const currentExists = alunos.some(a => a.id === selectedChatStudentId);
      if (!currentExists) {
        // Current selection no longer valid — pick the first available student
        setSelectedChatStudentId(alunos[1]?.id || alunos[0]?.id || '');
      }
    } else {
      // Database empty (e.g., cleared for production) — reset to empty string
      setSelectedChatStudentId('');
    }
  }, [alunos]);

  // Always derive selectedStudent from the current valid selectedChatStudentId
  const selectedStudent = alunos.find(a => a.id === selectedChatStudentId) || alunos[0];
  const currentChats = mensagens.filter(m => m.alunoId === (selectedStudent?.id ?? selectedChatStudentId));

  const getGeminiApiKey = () => {
    const settings = getAISettings();
    switch (settings.provider) {
      case 'gemini': return settings.geminiKey;
      case 'openai': return settings.openaiKey;
      case 'groq': return settings.groqKey;
      case 'openrouter': return settings.openrouterKey;
      default: return '';
    }
  };

  const checkRealStatus = async () => {
    if (isEvolutionConfigured()) {
      try {
        const res = await checkConnectionStatus();
        onSetWhatsappOnline(res.connected);
        if (!res.connected) {
          fetchRealQr();
        }
      } catch (err) {
        console.error("Error checking connection status:", err);
      }
    }
  };

  const fetchRealQr = async () => {
    if (!isEvolutionConfigured()) return;
    setLoadingQrCode(true);
    try {
      const res = await getQrCode();
      if (res.connected) {
        onSetWhatsappOnline(true);
        onPostAlert('A instância do WhatsApp já está conectada!', 'success');
      } else if (res.qrCode) {
        // QR Code returns base64 image (could start with data:image/png;base64, or just raw base64)
        const qrBase64 = res.qrCode.startsWith('data:') ? res.qrCode : `data:image/png;base64,${res.qrCode}`;
        setRealQrCode(qrBase64);
      }
    } catch (err: any) {
      console.error("Error fetching QR Code:", err);
      onPostAlert(`Erro ao carregar o QR Code da Evolution API: ${err.message || err}`, 'error');
    } finally {
      setLoadingQrCode(false);
    }
  };

  // Check connection status on mount and register periodic checks
  useEffect(() => {
    checkRealStatus();
    const interval = setInterval(checkRealStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateScan = () => {
    if (isEvolutionConfigured()) {
      fetchRealQr();
      checkRealStatus();
      onPostAlert('Buscando QR Code atualizado da Evolution API...', 'success');
      return;
    }
    setIsSimulatingScan(true);
    setTimeout(() => {
      onSetWhatsappOnline(true);
      setIsSimulatingScan(false);
      onPostAlert('Automação de WhatsApp conectada via Evolution API com sucesso!', 'success');
    }, 2000);
  };

  const handleDisconnect = async () => {
    if (isEvolutionConfigured()) {
      if (window.confirm("Deseja realmente desconectar o WhatsApp da Evolution API?")) {
        const success = await logoutInstance();
        if (success) {
          onSetWhatsappOnline(false);
          setRealQrCode('');
          onPostAlert('Dispositivo desconectado da Evolution API com sucesso.', 'warning');
          // Automatically fetch a new QR code to allow scanning again
          fetchRealQr();
        } else {
          onPostAlert('Falha ao desconectar da Evolution API.', 'error');
        }
      }
      return;
    }
    onSetWhatsappOnline(false);
    onPostAlert('Dispositivo desconectado da Evolution API. A régua de cobrança automática está pausada.', 'warning');
  };

  // Generate simulated student reply when agent sends a message
  const getAISimulatedStudentReply = async (aluno: Aluno, agentMsg: string, history: WhatsAppMensagem[]): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const recentMessagesText = history
          .slice(-6)
          .map(m => `${m.tipo === 'HUMANO_CLIENTE' ? 'Aluno' : 'Atendente'}: ${m.texto}`)
          .join('\n');

        const prompt = `Você é o aluno ${aluno.nome}, matriculado no curso ${aluno.curso}.
O seu status financeiro atual na instituição FAEPI/Instituto Sentidos é ${aluno.statusFinanceiro} com valor pendente de R$ ${aluno.valorPendente.toFixed(2)}.
A instituição de ensino acabou de enviar uma mensagem para você no WhatsApp.

Histórico de mensagens:
${recentMessagesText}

Mensagem nova do atendente: "${agentMsg}"

Escreva uma resposta curta e natural de WhatsApp (1 ou 2 frases). Responda do ponto de vista do aluno.
Se você estiver inadimplente, invente uma justificativa realista (ex: atraso de salário, problemas familiares, esquecimento) e pergunte se pode pagar depois ou parcelar. Se já pagou, diga que vai enviar o comprovante.
Não use formatações formais ou cabeçalhos.`;

        const text = await generateTextWithActiveAI(prompt);
        return text || 'Certo, farei o pagamento hoje e aviso vocês.';
      } catch (e) {
        console.error("Erro chamando IA ativa para simular aluno:", e);
      }
    }

    // Default static student answers fallback
    const answers = [
      "Obrigado por me avisar, acabei de efetuar o pagamento. Onde posso enviar o comprovante?",
      "Tudo bem, farei o pagamento hoje no final do dia. Obrigado!",
      "Desculpe-me, tive um imprevisto médico. Posso parcelar essa parcela em duas vezes?",
      "Olá, recebi o boleto. Vou agendar para pagar até a data limite.",
    ];
    return answers[Math.floor(Math.random() * answers.length)];
  };

  // Generate chatbot response when student sends a message
  const getAIChatbotReply = async (aluno: Aluno, studentMsg: string, history: WhatsAppMensagem[]): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const recentMessagesText = history
          .slice(-6)
          .map(m => `${m.tipo === 'HUMANO_CLIENTE' ? 'Aluno' : 'Atendente'}: ${m.texto}`)
          .join('\n');

        const prompt = `Você é a "Sentia", assistente virtual de cobrança automática do Instituto Sentidos e FAEPI.
Você está conversando no WhatsApp com o aluno ${aluno.nome} (${aluno.curso}).
O status financeiro dele é ${aluno.statusFinanceiro} com valor pendente de R$ ${aluno.valorPendente.toFixed(2)}.

Histórico de mensagens:
${recentMessagesText}

Mensagem nova do Aluno: "${studentMsg}"

Escreva apenas a resposta direta do chatbot.`;

        const systemInstruction = `Você é a "Sentia", assistente virtual de cobrança automática do Instituto Sentidos e FAEPI.
Diretrizes:
1. Seja educada, acolhedora, prestativa e objetiva.
2. Responda em português como mensagem de WhatsApp (curta, parágrafos pequenos).
3. Se ele disser que já pagou, peça para enviar o comprovante por aqui.
4. Se ele pedir parcelamento ou flexibilização, diga que podemos parcelar o saldo em até 4 parcelas e pergunte se deseja que a secretaria prepare o termo.
5. Mantenha a resposta abaixo de 80 palavras.`;

        const text = await generateTextWithActiveAI(prompt, systemInstruction);
        return text || 'Olá! Recebemos sua mensagem. Poderia confirmar a data em que fará o pagamento?';
      } catch (e) {
        console.error("Erro chamando IA ativa para chatbot:", e);
      }
    }

    // Default template chatbot fallback
    const msgLower = studentMsg.toLowerCase();
    if (msgLower.includes('pago') || msgLower.includes('pagou') || msgLower.includes('comprovante') || msgLower.includes('quitei')) {
      return `Perfeito! Por favor, anexe o comprovante por aqui. Nossa equipe financeira fará a homologação do pagamento e a baixa no sistema em até 24 horas úteis.`;
    }
    if (msgLower.includes('parcelar') || msgLower.includes('acordo') || msgLower.includes('negociar') || msgLower.includes('consigo pagar') || msgLower.includes('dividir')) {
      return `Olá! Compreendemos a sua situação. Nós conseguimos fazer um acordo em parcelas de até 4 vezes sem juros para quitação de seu saldo pendente de R$ ${aluno.valorPendente.toFixed(2)}. Gostaria de formalizar essa proposta?`;
    }
    return `Olá! Sou a Sentia, assistente virtual. Para agilizar o seu atendimento financeiro, você deseja negociar uma parcela em aberto ou nos enviar o comprovante de uma mensalidade já paga?`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isSending || !selectedStudent) return;

    const messageText = textInput.trim();
    setTextInput('');
    setIsSending(true);

    const type = sendAsAgent ? 'HUMANO_AGENTE' : 'HUMANO_CLIENTE';
    onSendMessage(selectedChatStudentId, messageText, type);

    // Dynamic responses depending on the sender and the automation status
    setTimeout(async () => {
      const currentHistory = [...mensagens, {
        id: `temp-${Date.now()}`,
        alunoId: selectedChatStudentId,
        tipo: type,
        texto: messageText,
        dataHora: new Date().toISOString(),
        statusEnvio: 'ENTREGUE'
      } as WhatsAppMensagem];

      if (sendAsAgent) {
        // Agent typed: Student replies after a brief pause
        const reply = await getAISimulatedStudentReply(selectedStudent, messageText, currentHistory);
        onSendMessage(selectedChatStudentId, reply, 'HUMANO_CLIENTE');
      } else {
        // Student typed (Simulated): If robot automation is active, the robot replies
        const isRobotActive = !humanTakeoverList.includes(selectedChatStudentId);
        if (isRobotActive) {
          const reply = await getAIChatbotReply(selectedStudent, messageText, currentHistory);
          onSendMessage(selectedChatStudentId, reply, 'SISTEMA');
        } else {
          onPostAlert('O chatbot robô não respondeu pois este atendimento está sob controle Humano.', 'warning');
        }
      }
      setIsSending(false);
    }, 2000);
  };

  const toggleTakeover = (studentId: string) => {
    if (humanTakeoverList.includes(studentId)) {
      setHumanTakeoverList(prev => prev.filter(id => id !== studentId));
      onPostAlert(`Atendimento de ${alunos.find(a=>a.id===studentId)?.nome} devolvido para a Automação Inteligente (Robô).`, 'success');
    } else {
      setHumanTakeoverList(prev => [...prev, studentId]);
      onPostAlert(`Atendimento Humano assumido para ${alunos.find(a=>a.id===studentId)?.nome}. Os disparos robóticos ficarão interrompidos neste canal.`, 'success');
    }
  };

  // Simulated QR Code vector representation
  const qrCodeSvgPath = "M 10 10 L 40 10 L 40 40 L 10 40 Z M 60 10 L 90 10 L 90 40 L 60 40 Z M 10 60 L 40 60 L 40 90 L 10 90 Z M 50 50 L 55 50 L 60 55 L 55 60 Z M 70 70 L 85 70 L 85 85 L 70 85 Z";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Console Evolution API WhatsApp</h1>
        <p className="text-xs text-gray-400">Monitore o sincronismo de canais de entrega, visualize logs de disparos e atue no chat humano</p>
      </div>

      {/* Grid: Left stats tracker & connector, Right Interactive Chat window */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Connection panel & stats (Column 1 - Spans 1) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Connection status card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex justify-between items-center">
              <span>Status da Conexão</span>
              <span className={`h-2.5 w-2.5 rounded-full ${whatsappOnline ? 'bg-emerald-600 animate-ping' : 'bg-red-500'}`} />
            </h3>

            {whatsappOnline ? (
              <div className="space-y-4">
                {/* Connected display */}
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                  <SmartphoneNfc className="h-8 w-8 text-emerald-600 animate-bounce" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800">Celular Emparelhado</h4>
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      {isEvolutionConfigured() ? `Instância: ${getEvolutionSettings().instanceName}` : 'Evolution-API Instance v2.3.1'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                      {isEvolutionConfigured() ? 'Status: ONLINE / PRONTO' : 'Dispositivo: (86) 99820-0012'}
                    </p>
                  </div>
                </div>

                {/* API performance specs */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-gray-500">
                  <div className="bg-gray-50 p-2.5 rounded-lg">
                    <span className="text-gray-400 block font-normal uppercase text-[9px]">Latência</span>
                    <span className="font-mono font-bold text-gray-850 text-gray-850 text-gray-800">42ms</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg">
                    <span className="text-gray-400 block font-normal uppercase text-[9px]">Uptime</span>
                    <span className="font-mono font-bold text-gray-850 text-gray-800">142h 15m</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg">
                    <span className="text-gray-400 block font-normal uppercase text-[9px]">Entregas (Mês)</span>
                    <span className="font-mono font-bold text-gray-850 text-gray-800">14.150 / 99.8%</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg">
                    <span className="text-gray-400 block font-normal uppercase text-[9px]">Disparo Máximo</span>
                    <span className="font-mono font-bold text-gray-850 text-gray-800">5 msgs / seg</span>
                  </div>
                </div>

                <button
                  onClick={handleDisconnect}
                  className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold py-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PowerOff className="h-4 w-4" />
                  <span>Desconectar Instância</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Disconnected with scan action */}
                <p className="text-xs text-gray-500 leading-tight">
                  Seu celular de disparos financeiros está desconectado. Escaneie o QR Code abaixo com a câmera do seu WhatsApp para emparelhar a Evolution API.
                </p>

                {/* Simulated/Real QR Code box */}
                <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  {isEvolutionConfigured() ? (
                    loadingQrCode ? (
                      <div className="h-44 w-44 flex flex-col items-center justify-center text-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-[#ff8000]" />
                        <p className="text-[10px] text-gray-500 font-bold">Obtendo QR Code da API...</p>
                      </div>
                    ) : realQrCode ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent animate-pulse border-t-2 border-orange-500 w-full pointer-events-none" style={{height: '2px', top: '40%'}} />
                        <div className="h-40 w-40 bg-white border border-gray-200 p-2 rounded flex items-center justify-center relative">
                          <img src={realQrCode} alt="WhatsApp QR Code" className="h-36 w-36 object-contain" />
                        </div>
                        <button
                          onClick={handleSimulateScan}
                          className="mt-4 bg-[#03045e] hover:bg-[#03045e]/90 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Atualizar QR Code</span>
                        </button>
                      </>
                    ) : (
                      <div className="h-44 w-44 flex flex-col items-center justify-center text-center gap-2">
                        <QrCode className="h-8 w-8 text-gray-300" />
                        <p className="text-[10px] text-gray-500 font-bold">QR Code expirado ou indisponível</p>
                        <button
                          onClick={handleSimulateScan}
                          className="mt-2 bg-[#03045e] hover:bg-[#03045e]/90 text-white font-semibold text-[10px] px-2.5 py-1 rounded transition cursor-pointer"
                        >
                          Gerar QR Code
                        </button>
                      </div>
                    )
                  ) : (
                    // Simulation mode
                    isSimulatingScan ? (
                      <div className="h-44 w-44 flex flex-col items-center justify-center text-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-[#ff8000]" />
                        <p className="text-[10px] text-gray-500 font-bold">Conectando ao celular...</p>
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent animate-pulse border-t-2 border-orange-500 w-full pointer-events-none" style={{height: '2px', top: '40%'}} />
                        
                        <div className="h-40 w-40 bg-white border border-gray-200 p-2 rounded flex items-center justify-center relative">
                          <svg className="h-32 w-32 text-gray-900" viewBox="0 0 100 100" fill="currentColor">
                            <path d={qrCodeSvgPath} />
                            <rect x="15" y="15" width="10" height="10" fill="#03045e" />
                            <rect x="65" y="15" width="10" height="10" fill="#03045e" />
                            <rect x="15" y="65" width="10" height="10" fill="#03045e" />
                            <circle cx="50" cy="20" r="3" fill="#ff8000" />
                            <circle cx="50" cy="80" r="3" fill="#03045e" />
                            <circle cx="80" cy="50" r="3" fill="#ff8000" />
                          </svg>
                        </div>
                        
                        <button
                          onClick={handleSimulateScan}
                          className="mt-4 bg-[#03045e] hover:bg-[#03045e]/90 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition shadow-md cursor-pointer flex items-center gap-1"
                        >
                          <Zap className="h-3.5 w-3.5 text-orange-400" />
                          <span>Simular Escanear QR</span>
                        </button>
                      </>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Core Automação logs */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-gray-500" />
              API Logs Operacionais
            </h3>

            <div className="bg-slate-950 font-mono text-[9px] p-3 rounded-lg text-emerald-400 space-y-2 h-44 overflow-y-auto">
              <p className="text-gray-500">[2026-05-22 15:30:11] EV-API: Inicializado listener de webhook.</p>
              <p className="text-emerald-500">[2026-05-22 15:32:00] EV-API: Evento "message.upsert" processado para Thiago.</p>
              <p className="text-blue-400">[2026-05-22 15:35:12] SYSTEM: Varredura de inadimplentes agendada concluída.</p>
              {whatsappOnline ? (
                <p className="text-emerald-500 animate-pulse">[2026-05-22 15:39:15] EV-API: INSTANCE IN_ESTABLISHED_ONLINE_RUNNING</p>
              ) : (
                <p className="text-red-500 animate-pulse">[2026-05-22 15:39:15] EV-API: DESCONECTADO (ERR_NO_SESSION_FOUND)</p>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Takeover Chat Desk (Column 2 & 3 - Spans 2) */}
        {alunos.length === 0 ? (
          /* ── Empty state: no students loaded ── */
          <div className="lg:col-span-2 bg-white rounded-xl border border-dashed border-gray-200 p-10 shadow-xs flex flex-col items-center justify-center text-center gap-5 min-h-[28rem]">
            <div className="bg-blue-50 rounded-full p-5">
              <Users className="h-12 w-12 text-[#03045e]/60" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-base font-bold text-gray-800">Nenhum aluno cadastrado</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                O console de WhatsApp fica disponível assim que houver alunos na base de dados.
                Importe uma planilha ou cadastre um aluno manualmente para começar a usar a automação de cobranças.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <button
                onClick={() => onSetTab('alunos')}
                className="flex items-center gap-2 bg-[#03045e] hover:bg-[#03045e]/90 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition shadow-sm cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                Cadastrar / Importar Alunos
              </button>
              <button
                onClick={() => onSetTab('alunos')}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                <User className="h-4 w-4" />
                Cadastrar Manualmente
              </button>
            </div>

            <p className="text-[10px] text-gray-300 mt-1">
              Após importar ou cadastrar alunos, esta tela exibirá automaticamente os canais de atendimento.
            </p>
          </div>
        ) : (
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-xs flex flex-col md:flex-row gap-5 h-130">

          {/* Active Chats selector List (Inner Left) */}
          <div className="w-full md:w-1/3 border-r border-gray-100 pr-0 md:pr-4 flex flex-col h-full overflow-hidden">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-50 pb-3 mb-3">Estudantes em Atendimento</h4>

            <div className="space-y-1 overflow-y-auto flex-1 pr-1">
              {alunos.map(aluno => {
                const isSelected = selectedChatStudentId === aluno.id;
                const isHumanLed = humanTakeoverList.includes(aluno.id);
                return (
                  <button
                    key={aluno.id}
                    onClick={() => setSelectedChatStudentId(aluno.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition text-left cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-100/80 border border-slate-200' 
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img 
                        src={aluno.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                        alt={aluno.nome}
                        className="h-8 w-8 rounded-full object-cover border border-gray-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-gray-800 truncate leading-none">{aluno.nome}</p>
                        <p className="text-[9px] text-[#03045e] font-semibold mt-1 font-mono truncate">{aluno.matricula}</p>
                      </div>
                    </div>

                    {isHumanLed && (
                      <span className="text-[8px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase scale-90 shrink-0">Humano</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live conversation console & Takeover selector (Inner Right) */}
          <div className="flex-1 flex flex-col justify-between h-full overflow-hidden">
            
            {selectedStudent ? (
              <>
                {/* Conversation Header */}
                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-955 text-gray-900 font-sans leading-none">{selectedStudent.nome}</p>
                      <span className="text-[9px] text-gray-400 font-medium">{selectedStudent.curso}</span>
                    </div>
                  </div>

                  {/* Takeover toggle btn */}
                  <button
                    onClick={() => toggleTakeover(selectedStudent.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                      humanTakeoverList.includes(selectedStudent.id)
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-blue-50 text-[#03045e] border border-blue-100 hover:bg-blue-100'
                    }`}
                  >
                    <span>{humanTakeoverList.includes(selectedStudent.id) ? 'Automação Pausada' : 'Assumir Humano'}</span>
                  </button>
                </div>

                {/* Conversation List logs */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3 my-2 pr-1 scrollbar-thin flex flex-col">
                  {currentChats.length > 0 ? (
                    currentChats.map((msg) => {
                      const isRecipient = msg.tipo === 'HUMANO_CLIENTE';
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col max-w-[85%] ${isRecipient ? 'self-start' : 'self-end'}`}
                          style={{ alignSelf: isRecipient ? 'flex-start' : 'flex-end' }}
                        >
                          <div className={`p-3 rounded-2xl text-[11px] leading-relaxed font-sans ${
                            isRecipient 
                              ? 'bg-slate-100 text-gray-800 rounded-tl-none border border-slate-200/50' 
                              : msg.tipo === 'SISTEMA'
                                ? 'bg-orange-50 text-amber-900 border border-orange-100 rounded-tr-none'
                                : 'bg-[#03045e] text-white rounded-tr-none font-medium'
                          }`}>
                            <p>{msg.texto}</p>
                          </div>
                          
                          <div className={`flex items-center gap-1 text-[9px] text-gray-400 mt-1 ${isRecipient ? 'justify-start' : 'justify-end'}`}>
                            <span>{new Date(msg.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            {!isRecipient && (
                              <span className={`${msg.statusEnvio === 'LIDO' ? 'text-blue-500 font-bold' : 'text-gray-400'}`}>
                                {msg.statusEnvio === 'LIDO' ? '✓✓' : '✓'}
                              </span>
                            )}
                            <span className="font-bold lowercase">
                              ({msg.tipo === 'SISTEMA' ? 'robô' : msg.tipo === 'HUMANO_AGENTE' ? 'humano' : 'aluno'})
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-xs">
                      <MessageSquare className="h-8 w-8 text-gray-300 mb-1" />
                      <p className="font-semibold text-gray-500">Nenhum diálogo ativo com o WhatsApp</p>
                      <p className="text-[10px] text-gray-400">Clique em "Cobrar" na lista de parcelas para inicializar ou envie uma mensagem direta abaixo.</p>
                    </div>
                  )}
                </div>

                {/* Simulated sender selector */}
                {whatsappOnline && (
                  <div className="pb-2 flex justify-between items-center text-[10px] border-t border-gray-50 pt-2.5">
                    <span className="text-gray-400">Modo de Simulação do Teclado:</span>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setSendAsAgent(true)}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${sendAsAgent ? 'bg-[#03045e] text-white' : 'bg-gray-100 text-gray-500'}`}
                      >
                        Digitar como Atendente
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSendAsAgent(false)}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${!sendAsAgent ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                      >
                        Simular como Aluno (Sacado)
                      </button>
                    </div>
                  </div>
                )}

                {/* Prompt input field form */}
                <form onSubmit={handleSend} className="pt-2 flex gap-2">
                  <input 
                    type="text" 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={
                      !whatsappOnline 
                        ? "Conecte a Evolution API para liberar digitação..." 
                        : sendAsAgent 
                          ? "Escreva como atendente humano (o aluno responderá via IA)..." 
                          : "Escreva como o aluno (o robô Sentia responderá via IA)..."
                    }
                    disabled={!whatsappOnline || isSending}
                    className="flex-1 bg-gray-50 border border-gray-205 border-gray-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#03045e] focus:bg-white focus:outline-hidden disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!whatsappOnline || !textInput.trim() || isSending}
                    className="bg-[#03045e] hover:bg-blue-900 text-white p-2.5 rounded-lg transition shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[40px]"
                  >
                    {isSending ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-405 text-gray-400 text-xs">
                <User className="h-10 w-10 text-gray-300 mb-2" />
                <p className="font-semibold text-gray-500">Nenhum aluno selecionado</p>
                <p className="text-[10px] text-gray-400">Cadastre ou importe alunos para iniciar atendimentos via WhatsApp.</p>
              </div>
            )}

          </div>

        </div>
        )} {/* end alunos.length === 0 ternary */}

      </div>
    </div>
  );
}
