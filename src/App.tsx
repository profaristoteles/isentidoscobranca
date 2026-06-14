import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LoginScreen from './components/LoginScreen';

// Core screens
import DashboardView from './components/DashboardView';
import StudentsView from './components/StudentsView';
import StudentDetailView from './components/StudentDetailView';
import ParcelasView from './components/ParcelasView';
import CobrancasRulesView from './components/CobrancasRulesView';
import WhatsAppView from './components/WhatsAppView';
import CRMView from './components/CRMView';
import ConfiguracoesView from './components/ConfiguracoesView';
import ConfirmarEnvioModal from './components/ConfirmarEnvioModal';
import {
  isEvolutionConfigured,
  checkConnectionStatus,
  sendTextMessage
} from './services/whatsappService';
import { safeGetItem, safeParseJson, safeRemoveItem, safeSetItem } from './utils/storage';

// Models & Dummy Dataset loaders
import {
  Aluno,
  Parcela,
  ParcelaHistorico,
  WhatsAppMensagem,
  CobrancaRegra,
  CrmConfig,
  LogAtividade,
  Colaborador,
  SmtpConfig,
  GlobalSettings
} from './types';
import {
  INITIAL_ALUNOS,
  INITIAL_PARCELAS,
  INITIAL_PARCELA_HISTORICO,
  INITIAL_WHATSAPP_MENSAGENS,
  INITIAL_COBRANCA_REGRAS,
  INITIAL_CRM_CONFIG,
  INITIAL_LOGS_ATIVIDADE,
  INITIAL_POLOS,
  INITIAL_USERS,
  INITIAL_CURSOS
} from './mockData';
import {
  generateParcelas,
  getStatusEfetivo,
  podeReceberCobranca,
  formatParcela,
  novoHistorico
} from './utils/parcelas';

const normalizeForCompare = (val: unknown): unknown => {
  if (Array.isArray(val) && val.length > 0 && val[0] !== null && typeof val[0] === 'object' && 'id' in (val[0] as object)) {
    return [...val].sort((x: any, y: any) => String(x.id).localeCompare(String(y.id)));
  }
  return val;
};
const isSameJson = (a: unknown, b: unknown) =>
  JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));

const nowIso = () => new Date().toISOString();
const logTimestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

// Render a régua/cobrança template using parcela tokens.
const buildCobrancaText = (template: string, aluno: Aluno, parcela: Parcela) =>
  template
    .replace(/{nome_aluno}/g, aluno.nome)
    .replace(/{curso}/g, aluno.curso)
    .replace(/{valor}/g, `R$ ${parcela.valorAtual.toFixed(2)}`)
    .replace(/{vencimento}/g, parcela.vencimento)
    .replace(/{parcela}/g, formatParcela(parcela));

export default function App() {
  // Session User State
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return safeGetItem('sentidos_user_email');
  });
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return safeGetItem('sentidos_current_tab') || 'dashboard';
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    return safeGetItem('sentidos_selected_student_id');
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // API Connection/Loaded State
  const [isUsingApi, setIsUsingApi] = useState<boolean>(false);
  const [dbLoaded, setDbLoaded] = useState<boolean>(false);

  // States database with local storage persistence
  const [polos, setPolos] = useState<string[]>(() => {
    return safeParseJson(safeGetItem('sentidos_polos'), INITIAL_POLOS);
  });
  const [cursos, setCursos] = useState<string[]>(() => {
    return safeParseJson(safeGetItem('sentidos_cursos'), INITIAL_CURSOS);
  });
  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    return safeParseJson(safeGetItem('sentidos_alunos'), INITIAL_ALUNOS);
  });
  const [parcelas, setParcelas] = useState<Parcela[]>(() => {
    return safeParseJson(safeGetItem('sentidos_parcelas'), INITIAL_PARCELAS);
  });
  const [parcelaHistorico, setParcelaHistorico] = useState<ParcelaHistorico[]>(() => {
    return safeParseJson(safeGetItem('sentidos_parcelaHistorico'), INITIAL_PARCELA_HISTORICO);
  });
  const [mensagens, setMensagens] = useState<WhatsAppMensagem[]>(() => {
    return safeParseJson(safeGetItem('sentidos_mensagens'), INITIAL_WHATSAPP_MENSAGENS);
  });
  const [regras, setRegras] = useState<CobrancaRegra[]>(() => {
    return safeParseJson(safeGetItem('sentidos_regras'), INITIAL_COBRANCA_REGRAS);
  });
  const [crmConfig, setCrmConfig] = useState<CrmConfig>(() => {
    return safeParseJson(safeGetItem('sentidos_crmConfig'), INITIAL_CRM_CONFIG);
  });
  const [logs, setLogs] = useState<LogAtividade[]>(() => {
    return safeParseJson(safeGetItem('sentidos_logs'), INITIAL_LOGS_ATIVIDADE);
  });
  const [users, setUsers] = useState<Colaborador[]>(() => {
    return safeParseJson(safeGetItem('sentidos_users'), INITIAL_USERS);
  });

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => {
    return safeParseJson(safeGetItem('sentidos_smtpConfig'), {
      host: 'smtp.zeptomail.com',
      port: 587,
      user: 'emailapikey',
      pass: '',
      fromEmail: '',
      fromName: 'Instituto Sentidos',
      secure: false,
      active: false
    });
  });

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
    return safeParseJson(safeGetItem('sentidos_globalSettings'), {
      teamPhoneNumber: '',
      dispatchMinIntervalSec: 15,
      dispatchMaxIntervalSec: 45
    });
  });

  // Confirmar Envio Modal States
  const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false);
  const [confirmarModalAluno, setConfirmarModalAluno] = useState<Aluno | null>(null);
  const [confirmarModalParcela, setConfirmarModalParcela] = useState<Parcela | null>(null);

  // LocalStorage sync effects
  useEffect(() => { safeSetItem('sentidos_polos', JSON.stringify(polos)); }, [polos]);
  useEffect(() => { safeSetItem('sentidos_cursos', JSON.stringify(cursos)); }, [cursos]);
  useEffect(() => { safeSetItem('sentidos_alunos', JSON.stringify(alunos)); }, [alunos]);
  useEffect(() => { safeSetItem('sentidos_parcelas', JSON.stringify(parcelas)); }, [parcelas]);
  useEffect(() => { safeSetItem('sentidos_parcelaHistorico', JSON.stringify(parcelaHistorico)); }, [parcelaHistorico]);
  useEffect(() => { safeSetItem('sentidos_mensagens', JSON.stringify(mensagens)); }, [mensagens]);
  useEffect(() => { safeSetItem('sentidos_regras', JSON.stringify(regras)); }, [regras]);
  useEffect(() => { safeSetItem('sentidos_crmConfig', JSON.stringify(crmConfig)); }, [crmConfig]);
  useEffect(() => { safeSetItem('sentidos_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { safeSetItem('sentidos_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { safeSetItem('sentidos_smtpConfig', JSON.stringify(smtpConfig)); }, [smtpConfig]);
  useEffect(() => { safeSetItem('sentidos_globalSettings', JSON.stringify(globalSettings)); }, [globalSettings]);
  useEffect(() => { safeSetItem('sentidos_current_tab', currentTab); }, [currentTab]);
  useEffect(() => {
    if (selectedStudentId) {
      safeSetItem('sentidos_selected_student_id', selectedStudentId);
    } else {
      safeRemoveItem('sentidos_selected_student_id');
    }
  }, [selectedStudentId]);

  // Ref to prevent sync loop when polling updates from backend
  const skipSyncRef = useRef(false);
  const pendingSyncRef = useRef(false);
  const isResettingRef = useRef(false);

  const setIfChanged = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, nextValue: T) => {
    setter(prev => {
      if (isSameJson(prev, nextValue)) {
        return prev;
      }
      skipSyncRef.current = true;
      return nextValue;
    });
  };

  // Initial Fetch from backend DB with LocalStorage fallback
  useEffect(() => {
    const fetchDB = async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const data = await response.json();
          if (data.alunos) setIfChanged(setAlunos, data.alunos);
          if (data.parcelas) setIfChanged(setParcelas, data.parcelas);
          if (data.parcelaHistorico) setIfChanged(setParcelaHistorico, data.parcelaHistorico);
          if (data.mensagens) setIfChanged(setMensagens, data.mensagens);
          if (data.regras) setIfChanged(setRegras, data.regras);
          if (data.crmConfig) setIfChanged(setCrmConfig, data.crmConfig);
          if (data.logs) setIfChanged(setLogs, data.logs);
          if (data.polos) setIfChanged(setPolos, data.polos);
          if (data.cursos) setIfChanged(setCursos, data.cursos);
          if (data.users) setIfChanged(setUsers, data.users);
          if (data.smtpConfig) setIfChanged(setSmtpConfig, data.smtpConfig);
          if (data.globalSettings) setIfChanged(setGlobalSettings, data.globalSettings);

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

  // Poll database updates from backend every 5 seconds
  useEffect(() => {
    if (!isUsingApi) return;

    const pollUpdates = async () => {
      if (pendingSyncRef.current || isResettingRef.current) return;

      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          if (isResettingRef.current) return;

          const data = await response.json();
          if (data.alunos) setIfChanged(setAlunos, data.alunos);
          if (data.parcelas) setIfChanged(setParcelas, data.parcelas);
          if (data.parcelaHistorico) setIfChanged(setParcelaHistorico, data.parcelaHistorico);
          if (data.mensagens) setIfChanged(setMensagens, data.mensagens);
          if (data.regras) setIfChanged(setRegras, data.regras);
          if (data.crmConfig) setIfChanged(setCrmConfig, data.crmConfig);
          if (data.logs) setIfChanged(setLogs, data.logs);
          if (data.polos) setIfChanged(setPolos, data.polos);
          if (data.cursos) setIfChanged(setCursos, data.cursos);
          if (data.users) setIfChanged(setUsers, data.users);
          if (data.smtpConfig) setIfChanged(setSmtpConfig, data.smtpConfig);
          if (data.globalSettings) setIfChanged(setGlobalSettings, data.globalSettings);
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
    if (isResettingRef.current) return;

    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    pendingSyncRef.current = true;

    const syncToBackend = async (attempt = 1) => {
      if (isResettingRef.current) {
        pendingSyncRef.current = false;
        return;
      }

      try {
        const response = await fetch('/api/save-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alunos,
            parcelas,
            parcelaHistorico,
            mensagens,
            regras,
            crmConfig,
            logs,
            polos,
            cursos,
            users,
            smtpConfig,
            globalSettings
          })
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          console.error(`[Sentidos Cobranças] Falha ao sincronizar (tentativa ${attempt}): ${response.status} ${errText}`);
          if (attempt < 5) {
            setTimeout(() => syncToBackend(attempt + 1), 2000 * attempt);
          } else {
            console.error('[Sentidos Cobranças] Máximo de tentativas atingido. Liberando poll.');
            pendingSyncRef.current = false;
          }
          return;
        }
        pendingSyncRef.current = false;
      } catch (err) {
        console.error(`[Sentidos Cobranças] Erro de rede ao sincronizar (tentativa ${attempt}):`, err);
        if (attempt < 5) {
          setTimeout(() => syncToBackend(attempt + 1), 2000 * attempt);
        } else {
          console.error('[Sentidos Cobranças] Máximo de tentativas atingido. Liberando poll.');
          pendingSyncRef.current = false;
        }
      }
    };

    const timeoutId = setTimeout(syncToBackend, 500);
    return () => clearTimeout(timeoutId);
  }, [alunos, parcelas, parcelaHistorico, mensagens, regras, crmConfig, logs, polos, cursos, users, smtpConfig, globalSettings, dbLoaded, isUsingApi]);

  // Connection states
  const [whatsappOnline, setWhatsappOnline] = useState<boolean>(true);

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
        setWhatsappOnline(true);
      }
    };
    checkStatusOnMount();
  }, []);

  // Notification Toast alert
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'warning' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const postToastAlert = (msg: string, type: 'success' | 'warning' | 'error') => {
    setToast({ msg, type });
  };

  // Audit log helper (ajuste F2)
  const logParcelaHistorico = (parcelaId: string, alunoId: string, acao: string, observacao?: string, usuario?: string) => {
    setParcelaHistorico(prev => [novoHistorico(parcelaId, alunoId, acao, observacao, usuario || userEmail || undefined), ...prev]);
  };

  // Effect 1: keep PENDENTE/ATRASADO in sync with due dates (never touches final statuses)
  useEffect(() => {
    setParcelas(prev => {
      let changed = false;
      const next = prev.map(p => {
        const eff = getStatusEfetivo(p);
        if (eff !== p.status) {
          changed = true;
          return { ...p, status: eff, atualizadoEm: nowIso() };
        }
        return p;
      });
      return changed ? next : prev;
    });
  }, [parcelas]);

  // Effect 2: recalculate each student's pending total & financial status from parcelas
  useEffect(() => {
    setAlunos(prevAlunos => {
      let hasChanges = false;
      const nextAlunos = prevAlunos.map(student => {
        const studentParcelas = parcelas.filter(p => p.alunoId === student.id);
        const emAberto = studentParcelas.filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO' || p.status === 'NEGOCIADO');
        const pendingSum = emAberto.reduce((acc, curr) => acc + curr.valorAtual, 0);

        // Quando os registros de parcelas estão incompletos (geração pendente),
        // usa o contrato financeiro para não subestimar o débito.
        const restantesContrato = Math.max(0, (student.totalParcelas ?? 0) - (student.parcelasPagas ?? 0));
        const valorContrato = restantesContrato * (student.valorMensalidade ?? 0);
        const effectivePendingSum = (restantesContrato > emAberto.length && valorContrato > pendingSum)
          ? valorContrato
          : pendingSum;

        let financialStatus: Aluno['statusFinanceiro'] = 'EM_DIA';
        if (restantesContrato > 0 || emAberto.length > 0) {
          const hasOverdue = emAberto.some(p => p.status === 'ATRASADO');
          financialStatus = hasOverdue ? 'INADIMPLENTE' : 'PENDENTE';
        }

        if (student.valorPendente === effectivePendingSum && student.statusFinanceiro === financialStatus) {
          return student;
        }

        hasChanges = true;
        return { ...student, valorPendente: effectivePendingSum, statusFinanceiro: financialStatus };
      });

      return hasChanges ? nextAlunos : prevAlunos;
    });
  }, [parcelas]);

  // Auth triggers
  const handleLogin = (email: string) => {
    setUserEmail(email);
    safeSetItem('sentidos_user_email', email);
    setCurrentTab('dashboard');
    postToastAlert(`Bem-vindo de volta! Sessão iniciada como ${email}`, 'success');
  };

  const handleLogout = () => {
    setUserEmail(null);
    safeRemoveItem('sentidos_user_email');
    safeRemoveItem('sentidos_auth_token');
    postToastAlert('Sessão encerrada com segurança.', 'warning');
  };

  // Generic parcela mutation helper
  const updateParcela = (parcelaId: string, patch: Partial<Parcela>) => {
    setParcelas(prev => prev.map(p => p.id === parcelaId ? { ...p, ...patch, atualizadoEm: nowIso() } : p));
  };

  // Operation: register a payment for a single parcela
  const handleMarkParcelaPaid = (parcelaId: string) => {
    const target = parcelas.find(p => p.id === parcelaId);
    if (!target) return;
    const wasNegotiated = target.status === 'NEGOCIADO';

    updateParcela(parcelaId, { status: 'PAGO', dataPagamento: new Date().toLocaleDateString('pt-BR') });
    logParcelaHistorico(parcelaId, target.alunoId, 'Pagamento registrado',
      `Parcela ${formatParcela(target)} quitada (R$ ${target.valorAtual.toFixed(2)})${wasNegotiated ? ' — recuperada via negociação' : ''}`);

    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: logTimestamp(),
      tipo: 'CRM',
      usuario: 'Retorno Bancário API',
      detalhe: `Pagamento da parcela ${formatParcela(target)} de ${target.alunoNome} (Ref: ${target.competencia}) no valor de R$ ${target.valorAtual.toFixed(2)}.`,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);

    const updatedCrmLogs = [
      `${logTimestamp()} - CRM Sincronizado: Tag "${crmConfig.tagMap.pago}" associada a ${target.alunoNome} pela quitação da parcela ${formatParcela(target)}.`,
      ...crmConfig.logSincronizacao
    ];
    setCrmConfig(prev => ({ ...prev, logSincronizacao: updatedCrmLogs }));

    postToastAlert(`Parcela ${formatParcela(target)} de ${target.alunoNome} marcada como paga.`, 'success');
  };

  // Operation: register a negotiation on a single parcela (sem gerar novas parcelas)
  const handleRegisterNegotiation = (parcelaId: string, observacao?: string) => {
    const target = parcelas.find(p => p.id === parcelaId);
    if (!target) return;
    updateParcela(parcelaId, { status: 'NEGOCIADO', observacoes: observacao || target.observacoes });
    logParcelaHistorico(parcelaId, target.alunoId, 'Status alterado para NEGOCIADO', observacao || 'Negociação registrada');
    postToastAlert(`Parcela ${formatParcela(target)} marcada como NEGOCIADO.`, 'success');
  };

  // Operation: edit due date
  const handleEditDueDate = (parcelaId: string, novoVencimento: string) => {
    const target = parcelas.find(p => p.id === parcelaId);
    if (!target) return;
    updateParcela(parcelaId, { vencimento: novoVencimento, status: getStatusEfetivo({ status: 'PENDENTE', vencimento: novoVencimento }) });
    logParcelaHistorico(parcelaId, target.alunoId, 'Vencimento alterado', `De ${target.vencimento} para ${novoVencimento}`);
    postToastAlert(`Vencimento da parcela ${formatParcela(target)} atualizado para ${novoVencimento}.`, 'success');
  };

  // Operation: edit current value (keeps valorOriginal)
  const handleEditValor = (parcelaId: string, novoValor: number) => {
    const target = parcelas.find(p => p.id === parcelaId);
    if (!target) return;
    updateParcela(parcelaId, { valorAtual: novoValor });
    logParcelaHistorico(parcelaId, target.alunoId, 'Parcela alterada', `Valor atual ajustado de R$ ${target.valorAtual.toFixed(2)} para R$ ${novoValor.toFixed(2)} (original R$ ${target.valorOriginal.toFixed(2)})`);
    postToastAlert(`Valor da parcela ${formatParcela(target)} atualizado.`, 'success');
  };

  // Operation: cancel parcela
  const handleCancelParcela = (parcelaId: string) => {
    const target = parcelas.find(p => p.id === parcelaId);
    if (!target) return;
    updateParcela(parcelaId, { status: 'CANCELADO' });
    logParcelaHistorico(parcelaId, target.alunoId, 'Parcela cancelada');
    postToastAlert(`Parcela ${formatParcela(target)} cancelada.`, 'warning');
  };

  // Operation: exempt parcela
  const handleExemptParcela = (parcelaId: string) => {
    const target = parcelas.find(p => p.id === parcelaId);
    if (!target) return;
    updateParcela(parcelaId, { status: 'ISENTO' });
    logParcelaHistorico(parcelaId, target.alunoId, 'Parcela isentada');
    postToastAlert(`Parcela ${formatParcela(target)} isentada.`, 'success');
  };

  // Operation: send WhatsApp charge for a single parcela (só PENDENTE/ATRASADO)
  const handleTriggerSingleParcelaWhatsApp = async (parcela: Parcela) => {
    if (!whatsappOnline) {
      postToastAlert('Impossível enviar. Evolution API está desconectada. Leia o QR Code.', 'error');
      return;
    }
    if (!podeReceberCobranca(parcela)) {
      postToastAlert(`A parcela ${formatParcela(parcela)} não está em aberto (status ${parcela.status}). Cobrança não enviada.`, 'warning');
      return;
    }

    const linkedStudent = alunos.find(a => a.id === parcela.alunoId);
    if (!linkedStudent) return;

    const activeRule = regras.find(r => r.ativo) || regras[0];
    const customizedText = buildCobrancaText(activeRule.mensagemTemplate, linkedStudent, parcela);

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

    const nowTime = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (apiSuccess) {
      updateParcela(parcela.id, { enviadoWhatsAppCount: parcela.enviadoWhatsAppCount + 1, ultimoEnvio: nowTime });
      logParcelaHistorico(parcela.id, linkedStudent.id, 'Cobrança enviada', `Disparo via régua para ${linkedStudent.nome}`);

      const newMsg: WhatsAppMensagem = {
        id: `msg-${Date.now()}`,
        alunoId: linkedStudent.id,
        tipo: 'SISTEMA',
        texto: customizedText,
        dataHora: nowIso(),
        statusEnvio: 'ENTREGUE'
      };
      setMensagens(prev => [...prev, newMsg]);

      const newLog: LogAtividade = {
        id: `log-${Date.now()}`,
        timestamp: logTimestamp(),
        tipo: 'WHATSAPP',
        usuario: 'Sistema de Automação',
        detalhe: `Cobrança da parcela ${formatParcela(parcela)} enviada para ${linkedStudent.nome} (${linkedStudent.whatsapp})`,
        sucesso: true
      };
      setLogs(prev => [newLog, ...prev]);

      postToastAlert(`Cobrança WhatsApp enviada para ${linkedStudent.nome}.`, 'success');
    } else {
      const newLog: LogAtividade = {
        id: `log-${Date.now()}`,
        timestamp: logTimestamp(),
        tipo: 'WHATSAPP',
        usuario: 'Sistema de Automação',
        detalhe: `Falha no disparo da parcela ${formatParcela(parcela)} para ${linkedStudent.nome}. Erro: ${apiErrorMsg}`,
        sucesso: false
      };
      setLogs(prev => [newLog, ...prev]);
      postToastAlert(`Falha ao disparar WhatsApp para ${linkedStudent.nome}: ${apiErrorMsg}`, 'error');
    }
  };

  // Operation: charge all overdue parcelas at once — with anti-ban random interval between dispatches
  const handleTriggerAllOverdueWhatsApp = async () => {
    if (!whatsappOnline) {
      postToastAlert('Disparo massivo recusado. Evolution API desconectada.', 'error');
      return;
    }

    const overdue = parcelas.filter(p => {
      if (p.status !== 'ATRASADO') return false;
      const student = alunos.find(a => a.id === p.alunoId);
      return student?.cobrancaAutomatica !== false;
    });

    if (overdue.length === 0) {
      postToastAlert('Nenhuma parcela em atraso (ATRASADO) com régua automática ativa.', 'warning');
      return;
    }

    const minMs = (globalSettings?.dispatchMinIntervalSec ?? 15) * 1000;
    const maxMs = (globalSettings?.dispatchMaxIntervalSec ?? 45) * 1000;

    postToastAlert(`Iniciando disparo de ${overdue.length} cobranças com intervalo anti-ban entre ${globalSettings?.dispatchMinIntervalSec ?? 15}s–${globalSettings?.dispatchMaxIntervalSec ?? 45}s...`, 'success');

    for (let i = 0; i < overdue.length; i++) {
      await handleTriggerSingleParcelaWhatsApp(overdue[i]);
      if (i < overdue.length - 1) {
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    postToastAlert(`Lote de cobrança concluído! ${overdue.length} parcelas notificadas com intervalo anti-ban.`, 'success');
  };

  // Operation: route a parcela to human attendance
  const handleSendParcelaToHuman = (parcela: Parcela) => {
    const student = alunos.find(a => a.id === parcela.alunoId);
    if (!student) return;
    logParcelaHistorico(parcela.id, student.id, 'Enviada para atendimento humano', `Parcela ${formatParcela(parcela)}`);
    setSelectedStudentId(student.id);
    setCurrentTab('whatsapp');
    postToastAlert(`Atendimento humano acionado para ${student.nome}.`, 'success');
  };

  // Toggle automatic billing
  const handleToggleCobrancaAutomatica = (alunoId: string) => {
    setAlunos(prev => prev.map(a => {
      if (a.id === alunoId) {
        const nextState = a.cobrancaAutomatica === false ? true : false;
        postToastAlert(`Cobrança automática ${nextState ? 'ativada' : 'desativada'} para ${a.nome}.`, 'success');
        return { ...a, cobrancaAutomatica: nextState };
      }
      return a;
    }));
  };

  // Send ad-hoc / human chat message
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
      const newLog: LogAtividade = {
        id: `log-${Date.now()}`,
        timestamp: logTimestamp(),
        tipo: 'WHATSAPP',
        usuario: tipo === 'SISTEMA' ? 'Sistema de Automação' : 'Atendente Humano',
        detalhe: `Falha no envio de mensagem para Aluno ID: ${alunoId}. Erro: ${apiErrorMsg}`,
        sucesso: false
      };
      setLogs(prev => [newLog, ...prev]);
      return;
    }

    const newMsg: WhatsAppMensagem = {
      id: `msg-${Date.now()}`,
      alunoId,
      tipo,
      texto,
      dataHora: nowIso(),
      statusEnvio: 'ENTREGUE'
    };
    setMensagens(prev => [...prev, newMsg]);

    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: logTimestamp(),
      tipo: 'WHATSAPP',
      usuario: tipo === 'SISTEMA' ? 'Sistema de Automação' : tipo === 'HUMANO_AGENTE' ? 'Atendente Humano' : 'Estudante FAEPI',
      detalhe: tipo === 'SISTEMA'
        ? `Robô de cobrança enviou mensagem automática.`
        : tipo === 'HUMANO_AGENTE'
          ? `Mensagem sob-demanda encaminhada para aluno ID: ${alunoId}`
          : `Estudante ID: ${alunoId} enviou resposta via Whatsapp.`,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Negotiation: original parcelas → NEGOCIADO; new agreement parcelas only on confirmation (ajuste F6)
  const handleSimulateDeal = (alunoId: string, qtdParcelas: number, valorTotal: number) => {
    const alunoObj = alunos.find(a => a.id === alunoId);
    if (!alunoObj) return;

    // 1. Open parcelas of this student become NEGOCIADO
    const abertas = parcelas.filter(p => p.alunoId === alunoId && (p.status === 'PENDENTE' || p.status === 'ATRASADO'));
    setParcelas(prev => prev.map(p =>
      p.alunoId === alunoId && (p.status === 'PENDENTE' || p.status === 'ATRASADO')
        ? { ...p, status: 'NEGOCIADO', atualizadoEm: nowIso() }
        : p
    ));
    abertas.forEach(p => logParcelaHistorico(p.id, alunoId, 'Status alterado para NEGOCIADO', 'Incluída no acordo de parcelamento'));

    // 2. Confirmed agreement → create new NEGOCIACAO parcelas
    const valorParcela = valorTotal / qtdParcelas;
    const refDate = new Date();
    const novasParcelas: Parcela[] = Array.from({ length: qtdParcelas }).map((_, idx) => {
      const nextMonth = new Date(refDate);
      nextMonth.setMonth(refDate.getMonth() + idx + 1);
      nextMonth.setDate(alunoObj.diaVencimento || 10);
      const comp = `${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`;
      const venc = `${String(nextMonth.getDate()).padStart(2, '0')}/${comp}`;
      const id = `acordo-${Date.now()}-${idx + 1}`;
      const created: Parcela = {
        id,
        alunoId,
        alunoNome: alunoObj.nome,
        curso: alunoObj.curso,
        turma: alunoObj.turma || '',
        polo: alunoObj.polo,
        numeroParcela: idx + 1,
        totalParcelas: qtdParcelas,
        competencia: comp,
        vencimento: venc,
        valorOriginal: valorParcela,
        valorAtual: valorParcela,
        status: 'PENDENTE',
        origem: 'NEGOCIACAO',
        observacoes: 'Acordo de renegociação',
        enviadoWhatsAppCount: 0,
        criadoEm: nowIso(),
        atualizadoEm: nowIso()
      };
      created.status = getStatusEfetivo(created);
      return created;
    });
    setParcelas(prev => [...novasParcelas, ...prev]);
    novasParcelas.forEach(p => logParcelaHistorico(p.id, alunoId, 'Acordo criado', `Parcela ${formatParcela(p)} do acordo (R$ ${valorParcela.toFixed(2)})`));

    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: logTimestamp(),
      tipo: 'CRM',
      usuario: 'Atendente Humano',
      detalhe: `Acordo financeiro fechado para ${alunoObj.nome} em ${qtdParcelas} parcelas de R$ ${valorParcela.toFixed(2)}.`,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);

    const updatedCrmLogs = [
      `${logTimestamp()} - CRM LeadConnector: Lead movido para "Acordo Realizado" para ${alunoObj.nome}.`,
      ...crmConfig.logSincronizacao
    ];
    setCrmConfig(prev => ({ ...prev, logSincronizacao: updatedCrmLogs }));
  };

  // Jump helper
  const handleSelectStudentJump = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentTab('alunos');
  };

  // Fast WhatsApp from student list — always picks the oldest overdue installment first, then oldest pending
  const handleFastWhatsAppNotification = (student: Aluno) => {
    const studentParcelas = parcelas.filter(p => p.alunoId === student.id);

    // Priority 1: oldest ATRASADO (overdue) installment
    const atrasadas = studentParcelas
      .filter(p => p.status === 'ATRASADO')
      .sort((a, b) => a.numeroParcela - b.numeroParcela);

    // Priority 2: oldest PENDENTE installment (if no overdue)
    const pendentes = studentParcelas
      .filter(p => p.status === 'PENDENTE')
      .sort((a, b) => a.numeroParcela - b.numeroParcela);

    const outstanding = atrasadas[0] || pendentes[0];
    if (outstanding) {
      handleOpenConfirmarModal(outstanding);
    } else {
      postToastAlert(`${student.nome} não apresenta parcelas em aberto no momento.`, 'warning');
    }
  };

  const handleOpenConfirmarModal = (parcela: Parcela) => {
    const student = alunos.find(a => a.id === parcela.alunoId);
    if (!student) return;
    setConfirmarModalAluno(student);
    setConfirmarModalParcela(parcela);
    setIsConfirmarModalOpen(true);
  };

  const handleSendCustomCobranca = async (
    canal: 'WHATSAPP' | 'EMAIL',
    text: string,
    subject?: string,
    destinatario?: 'ALUNO' | 'EQUIPE_INTERNA'
  ) => {
    if (!confirmarModalAluno || !confirmarModalParcela) return;
    const student = confirmarModalAluno;
    const parcela = confirmarModalParcela;

    let apiSuccess = true;
    let apiErrorMsg = '';

    const nowTime = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (canal === 'WHATSAPP') {
      let targetNumber = student.whatsapp;
      let logDestName = student.nome;

      if (destinatario === 'EQUIPE_INTERNA') {
        const teamNum = globalSettings?.teamPhoneNumber || '';
        if (!teamNum.trim()) {
          postToastAlert('WhatsApp da equipe interna não configurado! Disparando para o aluno como fallback.', 'warning');
        } else {
          targetNumber = teamNum;
          logDestName = `Equipe Interna (${teamNum})`;
        }
      }

      if (isEvolutionConfigured()) {
        try {
          await sendTextMessage(targetNumber, text);
        } catch (err: any) {
          apiSuccess = false;
          apiErrorMsg = err.message || err;
          console.error("Erro no disparo manual do WhatsApp:", err);
        }
      }

      if (apiSuccess) {
        updateParcela(parcela.id, { enviadoWhatsAppCount: parcela.enviadoWhatsAppCount + 1, ultimoEnvio: nowTime });
        logParcelaHistorico(parcela.id, student.id, 'Cobrança enviada', `Manual WhatsApp para ${logDestName}`);

        const newMsg: WhatsAppMensagem = {
          id: `msg-${Date.now()}`,
          alunoId: student.id,
          tipo: 'SISTEMA',
          texto: text,
          dataHora: nowIso(),
          statusEnvio: 'ENTREGUE'
        };
        setMensagens(prev => [...prev, newMsg]);

        const newLog: LogAtividade = {
          id: `log-${Date.now()}`,
          timestamp: logTimestamp(),
          tipo: 'WHATSAPP',
          usuario: 'Atendente Humano',
          detalhe: `Cobrança via WhatsApp enviada para ${logDestName}.`,
          sucesso: true
        };
        setLogs(prev => [newLog, ...prev]);

        postToastAlert(`Cobrança WhatsApp enviada para ${logDestName}.`, 'success');
      } else {
        const newLog: LogAtividade = {
          id: `log-${Date.now()}`,
          timestamp: logTimestamp(),
          tipo: 'WHATSAPP',
          usuario: 'Atendente Humano',
          detalhe: `Falha ao enviar cobrança via WhatsApp para ${logDestName}. Erro: ${apiErrorMsg}`,
          sucesso: false
        };
        setLogs(prev => [newLog, ...prev]);
        postToastAlert(`Falha ao disparar WhatsApp para ${logDestName}: ${apiErrorMsg}`, 'error');
      }
    } else {
      // E-mail Channel
      let targetEmail = student.email;
      let logDestName = student.nome;

      if (destinatario === 'EQUIPE_INTERNA') {
        const teamEmail = smtpConfig?.fromEmail || '';
        if (teamEmail) {
          targetEmail = teamEmail;
          logDestName = `Equipe Interna (${teamEmail})`;
        } else {
          postToastAlert('E-mail do remetente SMTP não configurado! Disparando para o aluno.', 'warning');
        }
      }

      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetEmail,
            subject: subject || 'Aviso de Cobrança',
            body: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">${text.replace(/\n/g, '<br />')}</div>`
          })
        });

        const result = await res.json();
        if (res.ok && result.messageId) {
          updateParcela(parcela.id, { enviadoWhatsAppCount: parcela.enviadoWhatsAppCount + 1, ultimoEnvio: nowTime });
          logParcelaHistorico(parcela.id, student.id, 'Cobrança enviada', `Manual E-mail para ${logDestName}`);

          const newLog: LogAtividade = {
            id: `log-${Date.now()}`,
            timestamp: logTimestamp(),
            tipo: 'USUARIO',
            usuario: 'Atendente Humano',
            detalhe: `E-mail de cobrança enviado para ${logDestName} (${targetEmail}). Subject: ${subject}`,
            sucesso: true
          };
          setLogs(prev => [newLog, ...prev]);
          postToastAlert(`E-mail de cobrança enviado com sucesso para ${logDestName}!`, 'success');
        } else {
          throw new Error(result.error || result.message || 'Erro no envio');
        }
      } catch (err: any) {
        const newLog: LogAtividade = {
          id: `log-${Date.now()}`,
          timestamp: logTimestamp(),
          tipo: 'USUARIO',
          usuario: 'Atendente Humano',
          detalhe: `Falha ao enviar e-mail de cobrança para ${logDestName}. Erro: ${err.message || err}`,
          sucesso: false
        };
        setLogs(prev => [newLog, ...prev]);
        postToastAlert(`Falha ao disparar e-mail de cobrança: ${err.message || err}`, 'error');
      }
    }
  };

  // Add new students (manual/bulk CSV) + generate parcelas from matrícula financeira
  const handleAddAlunos = (
    novos: Omit<Aluno, 'id' | 'matricula' | 'valorPendente' | 'statusFinanceiro' | 'cadastroData'>[]
  ): Aluno[] => {
    const today = new Date().toISOString().split('T')[0];

    const prefix = '2026-';
    const existingSuffixes = alunos
      .filter(a => a.matricula.startsWith(prefix))
      .map(a => {
        const parsed = parseInt(a.matricula.slice(prefix.length), 10);
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
        avatarUrl: `https://images.unsplash.com/photo-${index % 2 === 0 ? '1535713875002-d1d0cf377fde' : '1494790108377-be9c29b29330'}?w=150`,
        cobrancaAutomatica: true
      };
    });

    setAlunos(prev => [...prev, ...mappedAlunos]);

    // Generate parcelas for students that carry a matrícula financeira (anti-duplicidade)
    let acumulado = parcelas;
    const todasNovasParcelas: Parcela[] = [];
    mappedAlunos.forEach(aluno => {
      const geradas = generateParcelas(aluno, acumulado, 'MATRICULA');
      if (geradas.length > 0) {
        todasNovasParcelas.push(...geradas);
        acumulado = [...acumulado, ...geradas];
      }
    });
    if (todasNovasParcelas.length > 0) {
      setParcelas(prev => [...todasNovasParcelas, ...prev]);
      setParcelaHistorico(prev => [
        ...todasNovasParcelas.map(p => novoHistorico(p.id, p.alunoId, 'Parcela criada', `Parcela ${formatParcela(p)} gerada da matrícula financeira`, userEmail || undefined)),
        ...prev
      ]);
    }

    const detail = mappedAlunos.length === 1
      ? `Estudante ${mappedAlunos[0].nome} cadastrado (Matrícula: ${mappedAlunos[0].matricula}). ${todasNovasParcelas.length} parcelas geradas.`
      : `Cadastro em lote: ${mappedAlunos.length} estudantes importados, ${todasNovasParcelas.length} parcelas geradas.`;

    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: logTimestamp(),
      tipo: mappedAlunos.length === 1 ? 'USUARIO' : 'IMPORTACAO',
      usuario: 'adm.financeiro',
      detalhe: detail,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);

    postToastAlert(
      mappedAlunos.length === 1
        ? `Estudante ${mappedAlunos[0].nome} cadastrado com ${todasNovasParcelas.length} parcelas!`
        : `Sucesso! ${mappedAlunos.length} estudantes importados (${todasNovasParcelas.length} parcelas).`,
      'success'
    );

    return mappedAlunos;
  };

  // Reset Database
  const handleResetDatabase = async () => {
    isResettingRef.current = true;
    const clearLocal = () => {
      ['sentidos_alunos', 'sentidos_parcelas', 'sentidos_parcelaHistorico', 'sentidos_mensagens',
        'sentidos_regras', 'sentidos_crmConfig', 'sentidos_logs', 'sentidos_polos', 'sentidos_users']
        .forEach(safeRemoveItem);
    };
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (response.ok) {
        clearLocal();
        postToastAlert('Banco de dados redefinido para o padrão! Recarregando...', 'success');
        setTimeout(() => window.location.reload(), 800);
        return;
      } else {
        isResettingRef.current = false;
        const data = await response.json().catch(() => ({}));
        postToastAlert(data.error || 'O servidor respondeu com erro ao redefinir o banco.', 'error');
      }
    } catch (err) {
      clearLocal();
      postToastAlert('Banco offline redefinido para o padrão! Recarregando...', 'success');
      setTimeout(() => window.location.reload(), 800);
    }
  };

  // Clear Database for Production
  const handleClearDatabase = async () => {
    isResettingRef.current = true;
    const clearLocal = () => {
      ['sentidos_alunos', 'sentidos_parcelas', 'sentidos_parcelaHistorico', 'sentidos_mensagens', 'sentidos_logs']
        .forEach(safeRemoveItem);
    };
    try {
      const response = await fetch('/api/clear-db', { method: 'POST' });
      if (response.ok) {
        clearLocal();
        postToastAlert('Banco de dados limpo para produção! Recarregando...', 'success');
        setTimeout(() => window.location.reload(), 800);
        return;
      } else {
        isResettingRef.current = false;
        const data = await response.json().catch(() => ({}));
        postToastAlert(data.error || 'O servidor respondeu com erro ao limpar o banco de dados.', 'error');
      }
    } catch (err) {
      clearLocal();
      postToastAlert('Banco offline (localStorage) limpo para produção! Recarregando...', 'success');
      setTimeout(() => window.location.reload(), 800);
    }
  };

  // Delete student and dependencies
  const handleDeleteAluno = (alunoId: string) => {
    const studentObj = alunos.find(a => a.id === alunoId);
    if (!studentObj) return;

    setAlunos(prev => prev.filter(a => a.id !== alunoId));
    setParcelas(prev => prev.filter(p => p.alunoId !== alunoId));
    setParcelaHistorico(prev => prev.filter(h => h.alunoId !== alunoId));
    setMensagens(prev => prev.filter(m => m.alunoId !== alunoId));

    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: logTimestamp(),
      tipo: 'USUARIO',
      usuario: 'adm.financeiro',
      detalhe: `Estudante ${studentObj.nome} (Matrícula: ${studentObj.matricula}) excluído, junto com suas parcelas e histórico.`,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);

    if (selectedStudentId === alunoId) {
      setSelectedStudentId(null);
    }

    postToastAlert(`Estudante ${studentObj.nome} excluído com sucesso!`, 'success');
  };

  const handleUpdateAluno = (alunoId: string, updatedFields: Partial<Aluno>) => {
    const currentAluno = alunos.find(a => a.id === alunoId);
    if (!currentAluno) return;

    const updatedAluno: Aluno = { ...currentAluno, ...updatedFields };
    setAlunos(prev => prev.map(a => a.id === alunoId ? updatedAluno : a));

    // Detect if matrícula financeira fields changed (triggers parcela regeneration)
    const financialFields: (keyof Aluno)[] = [
      'parcelasPagas', 'totalParcelas', 'valorMensalidade',
      'primeiroVencimentoEmAberto', 'diaVencimento'
    ];
    const financialChanged = financialFields.some(
      f => f in updatedFields && updatedFields[f] !== currentAluno[f]
    );

    // Statuses that represent real settled transactions — never auto-removed
    const FINAL_STATUSES = ['PAGO', 'ISENTO', 'CANCELADO', 'NEGOCIADO'];

    let novasParcelas: Parcela[] = [];

    setParcelas(prev => {
      // Propagate name/course/polo/turma changes to existing parcelas
      const propagated = prev.map(p => {
        if (p.alunoId !== alunoId) return p;
        return {
          ...p,
          alunoNome: updatedFields.nome ?? p.alunoNome,
          curso: updatedFields.curso ?? p.curso,
          polo: updatedFields.polo ?? p.polo,
          turma: updatedFields.turma ?? p.turma
        };
      });

      if (!financialChanged) return propagated;

      // Remove open MATRICULA parcelas (PENDENTE/ATRASADO) so they can be regenerated
      const kept = propagated.filter(
        p => p.alunoId !== alunoId || p.origem !== 'MATRICULA' || FINAL_STATUSES.includes(p.status)
      );

      novasParcelas = generateParcelas(updatedAluno, kept, 'MATRICULA');
      return novasParcelas.length > 0 ? [...novasParcelas, ...kept] : kept;
    });

    if (financialChanged && novasParcelas.length > 0) {
      setParcelaHistorico(prev => [
        ...novasParcelas.map(p =>
          novoHistorico(
            p.id, p.alunoId,
            'Parcela recriada',
            `Parcela ${formatParcela(p)} recriada por edição da matrícula financeira`,
            userEmail || undefined
          )
        ),
        ...prev
      ]);
    }

    const newLog: LogAtividade = {
      id: `log-${Date.now()}`,
      timestamp: logTimestamp(),
      tipo: 'USUARIO',
      usuario: 'adm.financeiro',
      detalhe: `Cadastro do estudante ${updatedAluno.nome} (Matrícula: ${updatedAluno.matricula}) atualizado.${financialChanged ? ` ${novasParcelas.length} parcelas regeneradas.` : ''}`,
      sucesso: true
    };
    setLogs(prev => [newLog, ...prev]);
    postToastAlert(
      `Estudante ${updatedAluno.nome} atualizado!${financialChanged ? ` ${novasParcelas.length} parcelas regeneradas.` : ''}`,
      'success'
    );
  };

  // Core Conditional router rendering
  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <div className="animate-fade-in transition duration-300">
            <DashboardView
              alunos={alunos}
              parcelas={parcelas}
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
                  parcelas={parcelas}
                  parcelaHistorico={parcelaHistorico}
                  mensagens={mensagens}
                  onBack={() => setSelectedStudentId(null)}
                  onSendCustomWhatsApp={(alunoId, txt) => handleSendMessage(alunoId, txt, 'HUMANO_AGENTE')}
                  onMarkPaid={handleMarkParcelaPaid}
                  onSimulateDeal={handleSimulateDeal}
                  onToggleCobrancaAutomatica={handleToggleCobrancaAutomatica}
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
              cursos={cursos}
              onSelectStudent={handleSelectStudentJump}
              onFastWhatsAppNotification={handleFastWhatsAppNotification}
              onAddAlunos={handleAddAlunos}
              onUpdateAluno={handleUpdateAluno}
              onDeleteAluno={handleDeleteAluno}
              onToggleCobrancaAutomatica={handleToggleCobrancaAutomatica}
            />
          </div>
        );
      case 'parcelas':
        return (
          <div className="animate-fade-in transition duration-300">
            <ParcelasView
              parcelas={parcelas}
              alunos={alunos}
              onMarkPaid={handleMarkParcelaPaid}
              onRegisterNegotiation={handleRegisterNegotiation}
              onEditDueDate={handleEditDueDate}
              onEditValor={handleEditValor}
              onCancel={handleCancelParcela}
              onExempt={handleExemptParcela}
              onResendCharge={handleOpenConfirmarModal}
              onTriggerAllOverdue={handleTriggerAllOverdueWhatsApp}
              onSendToHuman={handleSendParcelaToHuman}
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
              onSetTab={setCurrentTab}
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
              onClearDatabase={handleClearDatabase}
              polos={polos}
              onUpdatePolos={setPolos}
              cursos={cursos}
              onUpdateCursos={setCursos}
              alunos={alunos}
              users={users}
              onUpdateUsers={setUsers}
              smtpConfig={smtpConfig}
              onUpdateSmtpConfig={setSmtpConfig}
              globalSettings={globalSettings}
              onUpdateGlobalSettings={setGlobalSettings}
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

  if (!userEmail) {
    return (
      <LoginScreen
        appName="Sentidos Cobranças"
        onLoginSuccess={handleLogin}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setSelectedStudentId(null);
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onLogout={handleLogout}
        userEmail={userEmail}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative lg:pl-64">
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
          onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="pt-24 px-4 sm:px-8 pb-12 flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto">
          {renderCurrentView()}
        </main>
      </div>

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

      {isConfirmarModalOpen && (
        <ConfirmarEnvioModal
          isOpen={isConfirmarModalOpen}
          onClose={() => setIsConfirmarModalOpen(false)}
          aluno={confirmarModalAluno}
          parcela={confirmarModalParcela}
          regras={regras}
          smtpConfig={smtpConfig}
          onConfirm={handleSendCustomCobranca}
        />
      )}
    </div>
  );
}
