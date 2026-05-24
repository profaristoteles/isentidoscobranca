import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  Sparkles,
  RefreshCw,
  XSquare
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LoginScreen from './components/LoginScreen';

// Core screens
import DashboardView from './components/DashboardView';
import StudentsView from './components/StudentsView';
import StudentDetailView from './components/StudentDetailView';
import BoletosView from './components/BoletosView';
import BoletosImportView from './components/BoletosImportView';
import CobrancasRulesView from './components/CobrancasRulesView';
import WhatsAppView from './components/WhatsAppView';
import CRMView from './components/CRMView';
import ConfiguracoesView from './components/ConfiguracoesView';
import { 
  isEvolutionConfigured, 
  checkConnectionStatus, 
  sendTextMessage 
} from './services/whatsappService';

// Models & Dummy Dataset loaders
import { 
  Aluno, 
  Boleto, 
  WhatsAppMensagem, 
  CobrancaRegra, 
  CrmConfig, 
  LogAtividade 
} from './types';
import { 
  INITIAL_ALUNOS, 
  INITIAL_BOLETOS, 
  INITIAL_WHATSAPP_MENSAGENS, 
  INITIAL_COBRANCA_REGRAS, 
  INITIAL_CRM_CONFIG, 
  INITIAL_LOGS_ATIVIDADE,
  INITIAL_POLOS
} from './mockData';

export default function App() {
  // Session User State
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('sentidos_user_email');
  });
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // API Connection/Loaded State
  const [isUsingApi, setIsUsingApi] = useState<boolean>(false);
  const [dbLoaded, setDbLoaded] = useState<boolean>(false);

  // States database with local storage persistence
  const [polos, setPolos] = useState<string[]>(() => {
    try {
      const local = localStorage.getItem('sentidos_polos');
      return local ? JSON.parse(local) : INITIAL_POLOS;
    } catch {
      return INITIAL_POLOS;
    }
  });
  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    try {
      const local = localStorage.getItem('sentidos_alunos');
      return local ? JSON.parse(local) : INITIAL_ALUNOS;
    } catch {
      return INITIAL_ALUNOS;
    }
  });
  const [boletos, setBoletos] = useState<Boleto[]>(() => {
    try {
      const local = localStorage.getItem('sentidos_boletos');
      return local ? JSON.parse(local) : INITIAL_BOLETOS;
    } catch {
      return INITIAL_BOLETOS;
    }
  });
  const [mensagens, setMensagens] = useState<WhatsAppMensagem[]>(() => {
    try {
      const local = localStorage.getItem('sentidos_mensagens');
      return local ? JSON.parse(local) : INITIAL_WHATSAPP_MENSAGENS;
    } catch {
      return INITIAL_WHATSAPP_MENSAGENS;
    }
  });
  const [regras, setRegras] = useState<CobrancaRegra[]>(() => {
    try {
      const local = localStorage.getItem('sentidos_regras');
      return local ? JSON.parse(local) : INITIAL_COBRANCA_REGRAS;
    } catch {
      return INITIAL_COBRANCA_REGRAS;
    }
  });
  const [crmConfig, setCrmConfig] = useState<CrmConfig>(() => {
    try {
      const local = localStorage.getItem('sentidos_crmConfig');
      return local ? JSON.parse(local) : INITIAL_CRM_CONFIG;
    } catch {
      return INITIAL_CRM_CONFIG;
    }
  });
  const [logs, setLogs] = useState<LogAtividade[]>(() => {
    try {
      const local = localStorage.getItem('sentidos_logs');
      return local ? JSON.parse(local) : INITIAL_LOGS_ATIVIDADE;
    } catch {
      return INITIAL_LOGS_ATIVIDADE;
    }
  });

  // LocalStorage sync effects
  useEffect(() => {
    localStorage.setItem('sentidos_polos', JSON.stringify(polos));
  }, [polos]);

  useEffect(() => {
    localStorage.setItem('sentidos_alunos', JSON.stringify(alunos));
  }, [alunos]);

  useEffect(() => {
    localStorage.setItem('sentidos_boletos', JSON.stringify(boletos));
  }, [boletos]);

  useEffect(() => {
    localStorage.setItem('sentidos_mensagens', JSON.stringify(mensagens));
  }, [mensagens]);

  useEffect(() => {
    localStorage.setItem('sentidos_regras', JSON.stringify(regras));
  }, [regras]);

  useEffect(() => {
    localStorage.setItem('sentidos_crmConfig', JSON.stringify(crmConfig));
  }, [crmConfig]);

  useEffect(() => {
    localStorage.setItem('sentidos_logs', JSON.stringify(logs));
  }, [logs]);

  // Ref to prevent sync loop when polling updates from backend
  const skipSyncRef = useRef(false);

  // Initial Fetch from backend DB with LocalStorage fallback
  useEffect(() => {
    const fetchDB = async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const data = await response.json();
          skipSyncRef.current = true;
          if (data.alunos) setAlunos(data.alunos);
          if (data.boletos) setBoletos(data.boletos);
          if (data.mensagens) setMensagens(data.mensagens);
          if (data.regras) setRegras(data.regras);
          if (data.crmConfig) setCrmConfig(data.crmConfig);
          if (data.logs) setLogs(data.logs);
          if (data.polos) setPolos(data.polos);
          
          setIsUsingApi(true);
          console.log('[Sentidos Cobranças] Banco de dados carregado com sucesso do backend.');
        } else {
          console.warn('[Sentidos Cobranças] Servidor de backend retornou erro. Usando localStorage.');
        }
      } catch (err) {
        console.warn('[Sentidos Cobranças] Servidor de backend offline ou inacessível. Usando localStorage.', err);
      } finally {
        setDbLoaded(true);
      }
    };
    fetchDB();
  }, []);

  // Poll database updates from backend every 5 seconds to load webhook messages/logs
  useEffect(() => {
    if (!isUsingApi) return;
    
    const pollUpdates = async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const data = await response.json();
          skipSyncRef.current = true;
          if (data.alunos) setAlunos(data.alunos);
          if (data.boletos) setBoletos(data.boletos);
          if (data.mensagens) setMensagens(data.mensagens);
          if (data.regras) setRegras(data.regras);
          if (data.crmConfig) setCrmConfig(data.crmConfig);
          if (data.logs) setLogs(data.logs);
          if (data.polos) setPolos(data.polos);
        }
      } catch (err) {
        console.warn('[Sentidos Cobranças] Erro ao buscar atualizações em segundo plano:', err);
      }
    };

    const interval = setInterval(pollUpdates, 5000);
    return () => clearInterval(interval);
  }, [isUsingApi]);

  // Sync to Backend JSON DB
  useEffect(() => {
    if (!dbLoaded || !isUsingApi) return;

    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    const syncToBackend = async () => {
      try {
        const response = await fetch('/api/save-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            alunos,
            boletos,
            mensagens,
            regras,
            crmConfig,
            logs,
            polos,
          }),
        });
        if (!response.ok) {
          console.error('[Sentidos Cobranças] Falha ao sincronizar dados no backend.');
        }
      } catch (err) {
        console.error('[Sentidos Cobranças] Erro de rede ao sincronizar dados no backend.', err);
      }
    };

    const timeoutId = setTimeout(syncToBackend, 500);
    return () => clearTimeout(timeoutId);
  }, [alunos, boletos, mensagens, regras, crmConfig, logs, polos, dbLoaded, isUsingApi]);

  // Connection states
  const [whatsappOnline, setWhatsappOnline] = useState<boolean>(true);

  // Check Evolution API connection on mount
  useEffect(() => {
    const checkStatusOnMount = async () => {
      if (isEvolutionConfigured()) {
        try {
          const res = await checkConnectionStatus();
          setWhatsappOnline(res.connected);
        } catch (err) {
          console.error("Erro ao verificar conexão inicial do WhatsApp:", err);
          setWhatsappOnline(false);
        }
      } else {
        // Fallback to true for simulation mode if not configured
        setWhatsappOnline(true);
      }
    };
    checkStatusOnMount();
  }, []);

  // Notification Toast alert
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const postToastAlert = (msg: string, type: 'success' | 'warning' | 'error') => {
    setToast({ msg, type });
  };

  // State calculations helper: Recalculate student pending totals when boletos values shift!
  useEffect(() => {
    setAlunos(prevAlunos => {
      return prevAlunos.map(student => {
        const unpaidBills = boletos.filter(b => b.alunoId === student.id && b.status !== 'PAGO');
        const pendingSum = unpaidBills.reduce((acc, curr) => acc + curr.valor, 0);
        
        let financialStatus: Aluno['statusFinanceiro'] = 'EM_DIA';
        if (unpaidBills.length > 0) {
          const hasOverdue = unpaidBills.some(b => b.status === 'VENCIDO');
          financialStatus = hasOverdue ? 'INADIMPLENTE' : 'PENDENTE';
        }

        return {
          ...student,
          valorPendente: pendingSum,
          statusFinanceiro: financialStatus
        };
      });
    });
  }, [boletos]);

  // Auth triggers
  const handleLogin = (email: string) => {
    setUserEmail(email);
    localStorage.setItem('sentidos_user_email', email);
    setCurrentTab('dashboard');
    postToastAlert(`Bem-vindo de volta! Sessão iniciada como ${email}`, 'success');
  };

  const handleLogout = () => {
    setUserEmail(null);
    localStorage.removeItem('sentidos_user_email');
    localStorage.removeItem('sentidos_auth_token');
    postToastAlert('Sessão encerrada com segurança.', 'warning');
  };

  // Operation 1: Simulate single boleto PAYMENT
  const handleSimulatePayment = (boletoId: string) => {
    const targetBoleto = boletos.find(b => b.id === boletoId);
    if (!targetBoleto) return;

    setBoletos(prev => prev.map(b => b.id === boletoId ? { ...b, status: 'PAGO' } : b));

    // Append activity log
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: nowTimestamp,
      tipo: 'CRM',
      usuario: 'Retorno Bancário API',
      detalhe: `Mensalidade consolidada de Mariana/Alunos (Ref: ${targetBoleto.competencia}) no valor de R$ ${targetBoleto.valor}.`,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);

    // Append CRM synchronization feedback automatically!
    const updatedCrmLogs = [
      `${nowTimestamp} - CRM Sincronizado: Tag "${crmConfig.tagMap.pago}" associada ao aluno ${targetBoleto.alunoNome} devido à quitação da Ref: ${targetBoleto.competencia}.`,
      ...crmConfig.logSincronizacao
    ];
    setCrmConfig(prev => ({
      ...prev,
      logSincronizacao: updatedCrmLogs
    }));

    postToastAlert(`Boleto ${targetBoleto.nossoNumero} quitado. O cadastro de ${targetBoleto.alunoNome} foi reclassificado automático.`, 'success');
  };

  // Operation 2: Add bulk OCR read boletos
  const handleImportBoletoSuccess = (novoBoleto: Boleto) => {
    setBoletos(prev => [novoBoleto, ...prev]);

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: nowTimestamp,
      tipo: 'IMPORTACAO',
      usuario: 'adm.financeiro',
      detalhe: `Boleto importado via OCR para ${novoBoleto.alunoNome} (Ref: ${novoBoleto.competencia}) no valor de R$ ${novoBoleto.valor}.`,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Operation 3: Fast trigger individual WhatsApp Billing Warning
  const handleTriggerSingleBoletoWhatsApp = async (boleto: Boleto) => {
    if (!whatsappOnline) {
      postToastAlert('Impossível enviar. Evolution API está desconectada. Leia o QR Code.', 'error');
      return;
    }

    const linkedStudent = alunos.find(a => a.id === boleto.alunoId);
    if (!linkedStudent) return;

    // Get active message Template (or default warning if none matches)
    const activeRule = regras.find(r => r.ativo) || regras[0];
    const customizedText = activeRule.mensagemTemplate
      .replace('{nome_aluno}', linkedStudent.nome)
      .replace('{curso}', linkedStudent.curso)
      .replace('{valor_boleto}', `R$ ${boleto.valor.toFixed(2)}`)
      .replace('{vencimento_boleto}', boleto.vencimento)
      .replace('{competencia}', boleto.competencia)
      .replace('{link_pdf}', `https://sentidos.edu.br/b/${boleto.id}`)
      .replace('{linha_digitavel}', boleto.linhaDigitavel);

    let apiSuccess = true;
    let apiErrorMsg = '';

    if (isEvolutionConfigured()) {
      try {
        await sendTextMessage(linkedStudent.whatsapp, customizedText);
      } catch (err: any) {
        apiSuccess = false;
        apiErrorMsg = err.message || err;
        console.error("Erro no disparo da Evolution API:", err);
      }
    }

    const nowTime = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    
    if (apiSuccess) {
      // Increment sending counts in boleto listing
      setBoletos(prev => prev.map(b => b.id === boleto.id ? {
        ...b,
        enviadoWhatsAppCount: b.enviadoWhatsAppCount + 1,
        ultimoEnvio: nowTime
      } : b));

      // Insert conversational message history log
      const nowIso = new Date().toISOString();
      const newMsg: WhatsAppMensagem = {
        id: `msg-${Date.now()}`,
        alunoId: linkedStudent.id,
        tipo: 'SISTEMA',
        texto: customizedText,
        dataHora: nowIso,
        statusEnvio: 'ENTREGUE'
      };
      setMensagens(prev => [...prev, newMsg]);

      // Insert activity log
      const logTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog: LogAtividade = {
        id: `log-${Date.now()}`,
        timestamp: logTime,
        tipo: 'WHATSAPP',
        usuario: 'Sistema de Automação',
        detalhe: `Disparo automático via régua de cobrança para ${linkedStudent.nome} (+55 ${linkedStudent.whatsapp})`,
        sucesso: true
      };
      setLogs(prev => [newLog, ...prev]);

      postToastAlert(`Alerta WhatsApp direcionado com sucesso para ${linkedStudent.nome}.`, 'success');
    } else {
      // Log failure
      const logTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog: LogAtividade = {
        id: `log-${Date.now()}`,
        timestamp: logTime,
        tipo: 'WHATSAPP',
        usuario: 'Sistema de Automação',
        detalhe: `Falha no disparo via régua para ${linkedStudent.nome} (+55 ${linkedStudent.whatsapp}). Erro: ${apiErrorMsg}`,
        sucesso: false
      };
      setLogs(prev => [newLog, ...prev]);
      
      postToastAlert(`Falha ao disparar WhatsApp para ${linkedStudent.nome}: ${apiErrorMsg}`, 'error');
    }
  };

  // Operation 4: Trigger warnings for ALL OVERDUE boletos at once
  const handleTriggerAllOverdueWhatsApp = () => {
    if (!whatsappOnline) {
      postToastAlert('Disparo massivo recusado. Evolution API desconectada.', 'error');
      return;
    }

    const overdueBoletos = boletos.filter(b => b.status === 'VENCIDO');
    if (overdueBoletos.length === 0) {
      postToastAlert('Nenhum boleto em atraso (VENCIDO) localizado no cadastro.', 'warning');
      return;
    }

    overdueBoletos.forEach(bol => {
      handleTriggerSingleBoletoWhatsApp(bol);
    });

    postToastAlert(`Lote de cobrança disparado! Notificado ${overdueBoletos.length} alunos com pendência.`, 'success');
  };

  // Operation 5: Send chat direct ad-hoc message or human reply
  const handleSendMessage = async (alunoId: string, texto: string, tipo: 'SISTEMA' | 'HUMANO_AGENTE' | 'HUMANO_CLIENTE') => {
    const targetStudent = alunos.find(a => a.id === alunoId);
    let apiSuccess = true;
    let apiErrorMsg = '';

    if (targetStudent && (tipo === 'HUMANO_AGENTE' || tipo === 'SISTEMA') && isEvolutionConfigured()) {
      try {
        await sendTextMessage(targetStudent.whatsapp, texto);
      } catch (err: any) {
        apiSuccess = false;
        apiErrorMsg = err.message || err;
        console.error("Erro no envio manual via Evolution API:", err);
      }
    }

    if (!apiSuccess) {
      postToastAlert(`Erro ao enviar WhatsApp: ${apiErrorMsg}`, 'error');
      // Insert failed activity log
      const logTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog: LogAtividade = {
        id: `log-${Date.now()}`,
        timestamp: logTime,
        tipo: 'WHATSAPP',
        usuario: tipo === 'SISTEMA' ? 'Sistema de Automação' : 'Atendente Humano',
        detalhe: `Falha no envio de mensagem para Aluno ID: ${alunoId}. Erro: ${apiErrorMsg}`,
        sucesso: false
      };
      setLogs(prev => [newLog, ...prev]);
      return;
    }

    const nowIso = new Date().toISOString();
    const newMsg: WhatsAppMensagem = {
      id: `msg-${Date.now()}`,
      alunoId,
      tipo,
      texto,
      dataHora: nowIso,
      statusEnvio: 'ENTREGUE'
    };
    setMensagens(prev => [...prev, newMsg]);

    // Insert activity log
    const logTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: logTime,
      tipo: 'WHATSAPP',
      usuario: tipo === 'SISTEMA' 
        ? 'Sistema de Automação' 
        : tipo === 'HUMANO_AGENTE' 
          ? 'Atendente Humano' 
          : 'Estudante FAEPI',
      detalhe: tipo === 'SISTEMA'
        ? `Robô de cobrança enviou mensagem automática.`
        : tipo === 'HUMANO_AGENTE'
          ? `Mensagem sob-demanda encaminhada para aluno ID: ${alunoId}`
          : `Estudante ID: ${alunoId} enviou resposta via Whatsapp.`,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Operation 6: Deal simulation (Negociações FAEPI)
  const handleSimulateDeal = (alunoId: string, parcelas: number, valorTotal: number) => {
    const alunoObj = alunos.find(a => a.id === alunoId);
    if (!alunoObj) return;

    // Simulate closing all currently overdue or open bills for this student, type as NEGOCIADO
    setBoletos(prev => prev.map(b => b.alunoId === alunoId ? { ...b, status: 'PAGO' } : b));

    // Append dynamic new negotiated parcelled bills
    const refDate = new Date();
    const novasParcelas: Boleto[] = Array.from({ length: parcelas }).map((_, pIdx) => {
      const nextMonth = new Date(refDate);
      nextMonth.setMonth(refDate.getMonth() + pIdx + 1);
      const compString = `${String(nextMonth.getMonth()+1).padStart(2, '0')}/${nextMonth.getFullYear()}`;
      
      const pId = `acordo-${Date.now()}-${pIdx+1}`;
      return {
        id: pId,
        alunoId: alunoId,
        alunoNome: alunoObj.nome,
        competencia: compString,
        vencimento: `10/${compString}`,
        valor: valorTotal / parcelas,
        status: 'ABERTO',
        linhaDigitavel: '00190.00009 02738.162006 12345.678901 8 ' + Math.floor(100000000+Math.random()*900000000),
        nossoNumero: `AA/2026-90${pIdx+1}`,
        pdfUrl: '#',
        enviadoWhatsAppCount: 0
      };
    });

    setBoletos(prev => [...novasParcelas, ...prev]);

    const logTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    // Log Activity
    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: logTime,
      tipo: 'CRM',
      usuario: 'Atendente Humano',
      detalhe: `Acordo financeiro fechado para ${alunoObj.nome} em ${parcelas} parcelas de R$ ${(valorTotal/parcelas).toFixed(2)}.`,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);

    // Push LeadConnector Log
    const updatedCrmLogs = [
      `${logTime} - CRM LeadConnector: Lead movido para fase "Acordo Realizado / Aguardando Boleto" para ${alunoObj.nome}.`,
      ...crmConfig.logSincronizacao
    ];
    setCrmConfig(prev => ({
      ...prev,
      logSincronizacao: updatedCrmLogs
    }));
  };

  // Jump helper: select student and slide to details
  const handleSelectStudentJump = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentTab('alunos');
  };

  // Single WhatsApp fast override from student general warning list click
  const handleFastWhatsAppNotification = (student: Aluno) => {
    // Find first unpaid bill for this student
    const outstandingBill = boletos.find(b => b.alunoId === student.id && b.status !== 'PAGO');
    if (outstandingBill) {
      handleTriggerSingleBoletoWhatsApp(outstandingBill);
    } else {
      postToastAlert(`O dependente ${student.nome} não apresenta mensalidades a faturar no momento.`, 'warning');
    }
  };

  // Add new students (manual/bulk CSV)
  const handleAddAlunos = (novos: Omit<Aluno, 'id' | 'matricula' | 'valorPendente' | 'statusFinanceiro' | 'cadastroData'>[]): Aluno[] => {
    const today = new Date().toISOString().split('T')[0];
    
    // helper to find max suffix for year 2026
    const prefix = '2026-';
    const existingSuffixes = alunos
      .filter(a => a.matricula.startsWith(prefix))
      .map(a => {
        const suffix = a.matricula.slice(prefix.length);
        const parsed = parseInt(suffix, 10);
        return isNaN(parsed) ? 0 : parsed;
      });
    const maxSuffix = existingSuffixes.length > 0 ? Math.max(...existingSuffixes) : 0;

    const mappedAlunos: Aluno[] = novos.map((item, index) => {
      const nextNum = maxSuffix + 1 + index;
      const matricula = `${prefix}${String(nextNum).padStart(4, '0')}`;
      return {
        ...item,
        id: `student-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        matricula,
        statusFinanceiro: 'EM_DIA',
        valorPendente: 0,
        cadastroData: today,
        avatarUrl: `https://images.unsplash.com/photo-${index % 2 === 0 ? '1535713875002-d1d0cf377fde' : '1494790108377-be9c29b29330'}?w=150`
      };
    });

    setAlunos(prev => [...prev, ...mappedAlunos]);

    // Logging
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const detail = mappedAlunos.length === 1 
      ? `Estudante ${mappedAlunos[0].nome} cadastrado com sucesso (Matrícula: ${mappedAlunos[0].matricula}).`
      : `Cadastro em lote realizado com sucesso. ${mappedAlunos.length} estudantes importados via CSV/Massa.`;

    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: nowTimestamp,
      tipo: mappedAlunos.length === 1 ? 'USUARIO' : 'IMPORTACAO',
      usuario: 'adm.financeiro',
      detalhe: detail,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);

    postToastAlert(
      mappedAlunos.length === 1 
        ? `Estudante ${mappedAlunos[0].nome} cadastrado com sucesso!`
        : `Sucesso! ${mappedAlunos.length} estudantes importados com sucesso.`,
      'success'
    );

    return mappedAlunos;
  };

  // Operation 7: Reset Database in server OR local storage
  const handleResetDatabase = async () => {
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        // Hydrate frontend state
        if (result.data) {
          const { alunos, boletos, mensagens, regras, crmConfig, logs, polos } = result.data;
          setAlunos(alunos);
          setBoletos(boletos);
          setMensagens(mensagens);
          setRegras(regras);
          setCrmConfig(crmConfig);
          setLogs(logs);
          if (polos) setPolos(polos);
        }
        
        // Remove localStorage items to ensure clean state
        localStorage.removeItem('sentidos_alunos');
        localStorage.removeItem('sentidos_boletos');
        localStorage.removeItem('sentidos_mensagens');
        localStorage.removeItem('sentidos_regras');
        localStorage.removeItem('sentidos_crmConfig');
        localStorage.removeItem('sentidos_logs');
        localStorage.removeItem('sentidos_polos');
        
        postToastAlert('Banco de dados local (JSON) redefinido para o padrão com sucesso!', 'success');
      } else {
        postToastAlert('O servidor de backend respondeu com erro ao redefinir o banco.', 'error');
      }
    } catch (err) {
      // Offline fallback: reset to initial files in localStorage
      localStorage.removeItem('sentidos_alunos');
      localStorage.removeItem('sentidos_boletos');
      localStorage.removeItem('sentidos_mensagens');
      localStorage.removeItem('sentidos_regras');
      localStorage.removeItem('sentidos_crmConfig');
      localStorage.removeItem('sentidos_logs');
      localStorage.removeItem('sentidos_polos');

      setAlunos(INITIAL_ALUNOS);
      setBoletos(INITIAL_BOLETOS);
      setMensagens(INITIAL_WHATSAPP_MENSAGENS);
      setRegras(INITIAL_COBRANCA_REGRAS);
      setCrmConfig(INITIAL_CRM_CONFIG);
      setLogs(INITIAL_LOGS_ATIVIDADE);
      setPolos(INITIAL_POLOS);

      postToastAlert('Banco offline (localStorage) redefinido para o padrão!', 'success');
    }
  };

  // Operation 8: Delete student and their dependencies safely
  const handleDeleteAluno = (alunoId: string) => {
    const studentObj = alunos.find(a => a.id === alunoId);
    if (!studentObj) return;

    // Remove student
    setAlunos(prev => prev.filter(a => a.id !== alunoId));
    // Filter out boletos
    setBoletos(prev => prev.filter(b => b.alunoId !== alunoId));
    // Filter out WhatsApp messages
    setMensagens(prev => prev.filter(m => m.alunoId !== alunoId));
    
    // Append activity log
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: nowTimestamp,
      tipo: 'USUARIO',
      usuario: 'adm.financeiro',
      detalhe: `Estudante ${studentObj.nome} (Matrícula: ${studentObj.matricula}) excluído com sucesso do sistema, junto com todas as suas cobranças e histórico de mensagens.`,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);

    // Clear selected student ID if it matches
    if (selectedStudentId === alunoId) {
      setSelectedStudentId(null);
    }

    postToastAlert(`Estudante ${studentObj.nome} excluído com sucesso!`, 'success');
  };

  // Core Conditional router rendering
  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <div className="animate-fade-in transition duration-300">
            <DashboardView 
              alunos={alunos} 
              boletos={boletos} 
              logs={logs} 
              onSetTab={setCurrentTab} 
            />
          </div>
        );
      case 'alunos':
        if (selectedStudentId) {
          const matchedStudent = alunos.find(a => a.id === selectedStudentId);
          if (matchedStudent) {
            return (
              <div className="animate-fade-in transition duration-300">
                <StudentDetailView 
                  student={matchedStudent}
                  boletos={boletos}
                  mensagens={mensagens}
                  onBack={() => setSelectedStudentId(null)}
                  onSendCustomWhatsApp={(alunoId, txt) => handleSendMessage(alunoId, txt, 'HUMANO_AGENTE')}
                  onSimulatePayment={handleSimulatePayment}
                  onSimulateDeal={handleSimulateDeal}
                />
              </div>
            );
          }
        }
        return (
          <div className="animate-fade-in transition duration-300">
            <StudentsView 
              alunos={alunos} 
              polos={polos}
              onSelectStudent={handleSelectStudentJump} 
              onFastWhatsAppNotification={handleFastWhatsAppNotification}
              onAddAlunos={handleAddAlunos}
              onDeleteAluno={handleDeleteAluno}
            />
          </div>
        );
      case 'boletos':
        return (
          <div className="animate-fade-in transition duration-300">
            <BoletosView 
              boletos={boletos}
              alunos={alunos}
              onSimulatePayment={handleSimulatePayment}
              onTriggerSingleBoletoWhatsApp={handleTriggerSingleBoletoWhatsApp}
              onTriggerAllOverdueWhatsApp={handleTriggerAllOverdueWhatsApp}
            />
          </div>
        );
      case 'importações':
        return (
          <div className="animate-fade-in transition duration-300">
            <BoletosImportView 
              alunos={alunos} 
              polos={polos}
              onAddAlunos={handleAddAlunos}
              onImportSuccess={handleImportBoletoSuccess}
              onPostAlert={postToastAlert}
            />
          </div>
        );
      case 'cobranças':
        return (
          <div className="animate-fade-in transition duration-300">
            <CobrancasRulesView 
              regras={regras}
              onSaveRegras={setRegras}
              onPostAlert={postToastAlert}
            />
          </div>
        );
      case 'whatsapp':
        return (
          <div className="animate-fade-in transition duration-300">
            <WhatsAppView 
              alunos={alunos}
              mensagens={mensagens}
              onSendMessage={handleSendMessage}
              whatsappOnline={whatsappOnline}
              onSetWhatsappOnline={setWhatsappOnline}
              onPostAlert={postToastAlert}
            />
          </div>
        );
      case 'crm':
        return (
          <div className="animate-fade-in transition duration-300">
            <CRMView 
              crmConfig={crmConfig}
              alunos={alunos}
              onUpdateCrmConfig={setCrmConfig}
              onPostAlert={postToastAlert}
            />
          </div>
        );
      case 'configurações':
        return (
          <div className="animate-fade-in transition duration-300">
            <ConfiguracoesView 
              onPostAlert={postToastAlert} 
              onResetDatabase={handleResetDatabase}
              polos={polos}
              onUpdatePolos={setPolos}
              alunos={alunos}
            />
          </div>
        );
      default:
        return (
          <div className="p-8 text-center text-slate-500 text-sm">
            Erro: Módulo ou tela não localizada.
          </div>
        );
    }
  };

  // If user is not logged in, render strict login console view
  if (!userEmail) {
    return (
      <LoginScreen 
        appName="Sentidos Cobranças" 
        onLoginSuccess={handleLogin} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar Navigation Panel */}
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={(tab) => {
          setSelectedStudentId(null); // Clear selections on tab navigation jumps
          setCurrentTab(tab);
        }} 
        onLogout={handleLogout}
        userEmail={userEmail}
      />

      {/* Main Right panel containing Topbar & Active Tab router displays */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen pb-12">
        {/* Superior Navigation Bar */}
        <Topbar 
          currentTab={currentTab} 
          crmSynced={crmConfig.sincronizacaoAtiva}
          whatsappOnline={whatsappOnline}
          selectedStudentName={
            selectedStudentId && currentTab === 'alunos' 
              ? alunos.find(a => a.id === selectedStudentId)?.nome 
              : null
          }
          onSelectStudentBack={() => setSelectedStudentId(null)}
          isUsingApi={isUsingApi}
        />

        {/* Core display panels container */}
        <main className="pt-24 px-8 flex-1">
          {renderCurrentView()}
        </main>
      </div>

      {/* Synergetic Notification float Toasts */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-white/10 flex items-start gap-3 max-w-sm transition-all duration-300 transform translate-y-0 scale-100 animate-slide-up">
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-relaxed font-sans">{toast.msg}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="p-0.5 text-gray-400 hover:text-white rounded cursor-pointer transition shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

