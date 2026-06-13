import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  HardDriveDownload, 
  Palette, 
  Database,
  Lock,
  CheckCircle2,
  HelpCircle,
  Mail,
  Send,
  UserPlus,
  Key,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Plus,
  Trash2,
  Smartphone,
  Globe,
  GraduationCap
} from 'lucide-react';
import { Aluno, Colaborador, SmtpConfig, GlobalSettings } from '../types';
import { checkConnectionStatus } from '../services/whatsappService';
import { safeGetItem, safeSetItem } from '../utils/storage';


interface ConfiguracoesViewProps {
  onPostAlert: (msg: string, type: 'success' | 'warning' | 'error') => void;
  onResetDatabase: () => void;
  onClearDatabase: () => void;
  polos: string[];
  onUpdatePolos: (newPolos: string[]) => void;
  cursos: string[];
  onUpdateCursos: (newCursos: string[]) => void;
  alunos: Aluno[];
  users: Colaborador[];
  onUpdateUsers: (newUsers: Colaborador[]) => void;
  smtpConfig: SmtpConfig;
  onUpdateSmtpConfig: (config: SmtpConfig) => void;
  globalSettings: GlobalSettings;
  onUpdateGlobalSettings: (settings: GlobalSettings) => void;
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Financeiro' | 'Secretaria';
  active: boolean;
}

export default function ConfiguracoesView({ 
  onPostAlert, 
  onResetDatabase, 
  onClearDatabase, 
  polos, 
  onUpdatePolos, 
  cursos,
  onUpdateCursos,
  alunos,
  users,
  onUpdateUsers,
  smtpConfig,
  onUpdateSmtpConfig,
  globalSettings,
  onUpdateGlobalSettings
}: ConfiguracoesViewProps) {
  
  // Registration form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Colaborador['role']>('Financeiro');

  // Password editing state
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [lgpdAnonCpf, setLgpdAnonCpf] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'USERS' | 'POLOS' | 'CURSOS' | 'LGPD' | 'APPEARANCE' | 'RESTORE' | 'APIS' | 'NOTIFICACOES'>(() => {
    return (safeGetItem('sentidos_active_subtab') as any) || 'USERS';
  });
  
  useEffect(() => {
    safeSetItem('sentidos_active_subtab', activeSubTab);
  }, [activeSubTab]);

  // SMTP and Notification settings states
  const [smtpHost, setSmtpHost] = useState(smtpConfig?.host || 'smtp.zeptomail.com');
  const [smtpPort, setSmtpPort] = useState(smtpConfig?.port || 587);
  const [smtpUser, setSmtpUser] = useState(smtpConfig?.user || 'emailapikey');
  const [smtpPass, setSmtpPass] = useState(smtpConfig?.pass || '');
  const [smtpFromEmail, setSmtpFromEmail] = useState(smtpConfig?.fromEmail || '');
  const [smtpFromName, setSmtpFromName] = useState(smtpConfig?.fromName || 'Instituto Sentidos');
  const [smtpSecure, setSmtpSecure] = useState(smtpConfig?.secure || false);
  const [smtpActive, setSmtpActive] = useState(smtpConfig?.active || false);

  const [teamPhone, setTeamPhone] = useState(globalSettings?.teamPhoneNumber || '');
  const [dispatchMinInterval, setDispatchMinInterval] = useState(globalSettings?.dispatchMinIntervalSec ?? 15);
  const [dispatchMaxInterval, setDispatchMaxInterval] = useState(globalSettings?.dispatchMaxIntervalSec ?? 45);

  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Sync props to local states
  useEffect(() => {
    if (smtpConfig) {
      setSmtpHost(smtpConfig.host);
      setSmtpPort(smtpConfig.port);
      setSmtpUser(smtpConfig.user);
      setSmtpPass(smtpConfig.pass);
      setSmtpFromEmail(smtpConfig.fromEmail);
      setSmtpFromName(smtpConfig.fromName);
      setSmtpSecure(smtpConfig.secure);
      setSmtpActive(smtpConfig.active);
    }
  }, [smtpConfig]);

  useEffect(() => {
    if (globalSettings) {
      setTeamPhone(globalSettings.teamPhoneNumber);
      setDispatchMinInterval(globalSettings.dispatchMinIntervalSec ?? 15);
      setDispatchMaxInterval(globalSettings.dispatchMaxIntervalSec ?? 45);
    }
  }, [globalSettings]);

  const handleTestSmtp = async () => {
    const trimmedEmail = testEmail.trim();
    if (!trimmedEmail) {
      onPostAlert('Informe um e-mail de destino para o teste.', 'warning');
      return;
    }

    setSendingTest(true);
    try {
      const config = {
        host: smtpHost,
        port: Number(smtpPort),
        user: smtpUser,
        pass: smtpPass,
        fromEmail: smtpFromEmail,
        fromName: smtpFromName,
        secure: smtpSecure,
        active: smtpActive
      };

      const res = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig: config, testEmail: trimmedEmail })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        onPostAlert(result.message, 'success');
      } else {
        onPostAlert(`Erro ao enviar teste SMTP: ${result.error || result.message}`, 'error');
      }
    } catch (err: any) {
      onPostAlert(`Erro na requisição de teste: ${err.message || err}`, 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveNotificacoes = () => {
    onUpdateSmtpConfig({
      host: smtpHost,
      port: Number(smtpPort),
      user: smtpUser,
      pass: smtpPass,
      fromEmail: smtpFromEmail,
      fromName: smtpFromName,
      secure: smtpSecure,
      active: smtpActive
    });

    onUpdateGlobalSettings({
      teamPhoneNumber: teamPhone,
      dispatchMinIntervalSec: Number(dispatchMinInterval),
      dispatchMaxIntervalSec: Number(dispatchMaxInterval)
    });

    onPostAlert('Configurações de Notificações, SMTP, WhatsApp da Equipe e Intervalo Anti-Ban salvas com sucesso!', 'success');
  };
  
  const [activeProvider, setActiveProvider] = useState(() => {
    return safeGetItem('sentidos_active_provider') || 'gemini';
  });
  const [geminiKey, setGeminiKey] = useState(() => {
    return safeGetItem('sentidos_gemini_api_key') || '';
  });
  const [openaiKey, setOpenaiKey] = useState(() => {
    return safeGetItem('sentidos_openai_api_key') || '';
  });
  const [openaiModel, setOpenaiModel] = useState(() => {
    return safeGetItem('sentidos_openai_model') || 'gpt-4o-mini';
  });
  const [groqKey, setGroqKey] = useState(() => {
    return safeGetItem('sentidos_groq_api_key') || '';
  });
  const [groqModel, setGroqModel] = useState(() => {
    return safeGetItem('sentidos_groq_model') || 'llama-3.3-70b-specdec';
  });
  const [openrouterKey, setOpenrouterKey] = useState(() => {
    return safeGetItem('sentidos_openrouter_api_key') || '';
  });
  const [openrouterModel, setOpenrouterModel] = useState(() => {
    return safeGetItem('sentidos_openrouter_model') || 'google/gemini-2.5-flash';
  });

  const [evolutionUrl, setEvolutionUrl] = useState(() => {
    return safeGetItem('sentidos_evolution_url') || '';
  });
  const [evolutionGlobalToken, setEvolutionGlobalToken] = useState(() => {
    return safeGetItem('sentidos_evolution_global_token') || '';
  });
  const [evolutionInstance, setEvolutionInstance] = useState(() => {
    return safeGetItem('sentidos_evolution_instance') || '';
  });
  const [evolutionInstanceToken, setEvolutionInstanceToken] = useState(() => {
    return safeGetItem('sentidos_evolution_instance_token') || '';
  });
  const [checkingConnection, setCheckingConnection] = useState(false);

  const handleTestEvolutionConnection = async () => {
    if (!evolutionUrl.trim() || !evolutionInstance.trim()) {
      onPostAlert('Por favor, informe a URL da API e o Nome da Instância para testar.', 'warning');
      return;
    }
    setCheckingConnection(true);
    // Temp save parameters in localStorage so connection check reads current inputs
    safeSetItem('sentidos_evolution_url', evolutionUrl.trim());
    safeSetItem('sentidos_evolution_global_token', evolutionGlobalToken.trim());
    safeSetItem('sentidos_evolution_instance', evolutionInstance.trim());
    safeSetItem('sentidos_evolution_instance_token', evolutionInstanceToken.trim());

    try {
      const res = await checkConnectionStatus();
      if (res.connected) {
        onPostAlert(`Conectado com sucesso à Evolution API! Instância "${evolutionInstance}" está com status ONLINE.`, 'success');
      } else {
        if (res.state === 'DISCONFIGURED') {
          onPostAlert('Configurações de URL ou Instância ausentes.', 'warning');
        } else if (res.state === 'close') {
          onPostAlert(`Evolution API está online, mas a instância "${evolutionInstance}" está DESCONECTADA do WhatsApp (requer leitura do QR Code).`, 'warning');
        } else {
          const detailStr = typeof res.details === 'object' ? JSON.stringify(res.details) : String(res.details);
          onPostAlert(`Instância "${evolutionInstance}" não está conectada. Estado: ${res.state}. Detalhes: ${detailStr}`, 'warning');
        }
      }
    } catch (e: any) {
      onPostAlert(`Erro ao se comunicar com a Evolution API: ${e.message || e}`, 'error');
    } finally {
      setCheckingConnection(false);
    }
  };

  const [novoPoloNome, setNovoPoloNome] = useState('');

  const handleAddPolo = () => {
    const trimmed = novoPoloNome.trim();
    if (!trimmed) {
      onPostAlert('O nome do polo não pode estar vazio.', 'warning');
      return;
    }
    if (polos.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      onPostAlert('Este polo já está cadastrado.', 'warning');
      return;
    }
    onUpdatePolos([...polos, trimmed]);
    setNovoPoloNome('');
    onPostAlert(`Polo "${trimmed}" cadastrado com sucesso!`, 'success');
  };

  const handleDeletePolo = (poloName: string, qtdAlunos: number) => {
    if (qtdAlunos > 0) {
      onPostAlert(`Não é possível excluir o polo "${poloName}" porque existem ${qtdAlunos} alunos vinculados a ele. Realoque-os primeiro.`, 'error');
      return;
    }
    if (window.confirm(`Tem certeza que deseja remover o polo "${poloName}"?`)) {
      onUpdatePolos(polos.filter(p => p !== poloName));
      onPostAlert(`Polo "${poloName}" removido com sucesso.`, 'success');
    }
  };

  const [novoCursoNome, setNovoCursoNome] = useState('');

  const handleAddCurso = () => {
    const trimmed = novoCursoNome.trim();
    if (!trimmed) {
      onPostAlert('O nome do curso não pode estar vazio.', 'warning');
      return;
    }
    if (cursos.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      onPostAlert('Este curso já está cadastrado.', 'warning');
      return;
    }
    onUpdateCursos([...cursos, trimmed]);
    setNovoCursoNome('');
    onPostAlert(`Curso "${trimmed}" cadastrado com sucesso!`, 'success');
  };

  const handleDeleteCurso = (cursoName: string, qtdAlunos: number) => {
    if (qtdAlunos > 0) {
      onPostAlert(`Não é possível excluir o curso "${cursoName}" porque existem ${qtdAlunos} alunos vinculados a ele. Realoque-os primeiro.`, 'error');
      return;
    }
    if (window.confirm(`Tem certeza que deseja remover o curso "${cursoName}"?`)) {
      onUpdateCursos(cursos.filter(c => c !== cursoName));
      onPostAlert(`Curso "${cursoName}" removido com sucesso.`, 'success');
    }
  };

  // Add mock administrator
  const handleRegisterColaborador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      onPostAlert('Todos os campos são obrigatórios.', 'warning');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
      onPostAlert('Já existe um colaborador com este e-mail.', 'warning');
      return;
    }

    const newUser: Colaborador = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword.trim(),
      role: newUserRole,
      active: true
    };

    onUpdateUsers([...users, newUser]);
    onPostAlert(`Colaborador "${newUser.name}" cadastrado com sucesso!`, 'success');
    
    // Reset form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('Financeiro');
    setShowAddForm(false);
  };

  const handleUpdatePassword = (userId: string) => {
    if (!newPasswordValue.trim()) {
      onPostAlert('A senha não pode ser vazia.', 'warning');
      return;
    }
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, password: newPasswordValue.trim() };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
    onPostAlert('Senha atualizada com sucesso!', 'success');
    setEditingPasswordUserId(null);
    setNewPasswordValue('');
  };

  const handleDeleteColaborador = (id: string, name: string) => {
    // Prevent deleting all administrators
    const adminCount = users.filter(u => u.role === 'Administrador').length;
    const targetUser = users.find(u => u.id === id);
    if (targetUser?.role === 'Administrador' && adminCount <= 1) {
      onPostAlert('Não é possível excluir o único administrador do sistema.', 'error');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o colaborador "${name}"?`)) {
      const updatedUsers = users.filter(u => u.id !== id);
      onUpdateUsers(updatedUsers);
      onPostAlert(`Colaborador "${name}" excluído com sucesso.`, 'success');
    }
  };

  const handleBackup = () => {
    onPostAlert('Exportando dump completo do banco local. Backup gerado com sucesso: sentidos_cobrancas_faepi_backup_2026.json', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Visual Title Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Preferências Gerais de Segurança & Sistema</h1>
        <p className="text-xs text-gray-400">Configure perfis de segurança, políticas de conformidade LGPD e gerencie cópias de segurança do banco de dados</p>
      </div>

      {/* Settings layout split: SubTabs on top/sidebar, content card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Switcher Links list */}
        <div className="md:col-span-1 space-y-1 bg-white p-3 rounded-xl border border-gray-100 h-fit shadow-3xs">
          <button
            onClick={() => setActiveSubTab('USERS')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeSubTab === 'USERS' ? 'bg-[#03045e] text-white' : 'text-gray-600 hover:bg-slate-50'
            }`}
          >
            <Users className="h-4.5 w-4.5" />
            <span>Colaboradores & Permissões</span>
          </button>

          <button
            onClick={() => setActiveSubTab('POLOS')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeSubTab === 'POLOS' ? 'bg-[#03045e] text-white' : 'text-gray-600 hover:bg-slate-50'
            }`}
          >
            <MapPin className="h-4.5 w-4.5" />
            <span>Polos Acadêmicos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('CURSOS')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeSubTab === 'CURSOS' ? 'bg-[#03045e] text-white' : 'text-gray-600 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="h-4.5 w-4.5" />
            <span>Cursos Acadêmicos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('LGPD')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeSubTab === 'LGPD' ? 'bg-[#03045e] text-white' : 'text-gray-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>Regulamento LGPD / Privacidade</span>
          </button>

          <button
            onClick={() => setActiveSubTab('APPEARANCE')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeSubTab === 'APPEARANCE' ? 'bg-[#03045e] text-white' : 'text-gray-600 hover:bg-slate-50'
            }`}
          >
            <Palette className="h-4.5 w-4.5" />
            <span>Aparência e Temas</span>
          </button>

          <button
            onClick={() => setActiveSubTab('RESTORE')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeSubTab === 'RESTORE' ? 'bg-[#03045e] text-white' : 'text-gray-600 hover:bg-slate-50'
            }`}
          >
            <Database className="h-4.5 w-4.5" />
            <span>Backups & Homologações</span>
          </button>

          <button
            onClick={() => setActiveSubTab('APIS')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeSubTab === 'APIS' ? 'bg-[#03045e] text-white' : 'text-gray-600 hover:bg-slate-50'
            }`}
          >
            <Key className="h-4.5 w-4.5" />
            <span>Configurações de APIs</span>
          </button>

          <button
            onClick={() => setActiveSubTab('NOTIFICACOES')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeSubTab === 'NOTIFICACOES' ? 'bg-[#03045e] text-white' : 'text-gray-600 hover:bg-slate-50'
            }`}
          >
            <Mail className="h-4.5 w-4.5" />
            <span>Notificações & SMTP</span>
          </button>
        </div>

        {/* Dynamic Display area panel */}
        <div className="md:col-span-3 bg-white border border-gray-100 rounded-xl p-6 shadow-sm min-h-96 flex flex-col justify-between">
          
          {/* SubTab 1: Users */}
          {activeSubTab === 'USERS' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Membros de Operações</h3>
                  <p className="text-xs text-gray-400">Usuários cadastrados no Instituto Sentidos para operar a esteira financeira</p>
                </div>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-[#03045e] hover:bg-blue-900 text-white font-bold text-xs px-3.5 py-1.8 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Cadastrar Colaborador</span>
                  </button>
                )}
              </div>

              {/* Inline Form to Add New User */}
              {showAddForm && (
                <form onSubmit={handleRegisterColaborador} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3.5 animate-slide-up">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                    <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Novo Colaborador</p>
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">Nome Completo</label>
                      <input
                        type="text"
                        placeholder="Nome do Colaborador"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">E-mail (Login)</label>
                      <input
                        type="email"
                        placeholder="exemplo@sentidos.edu.br"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">Senha de Acesso</label>
                      <input
                        type="password"
                        placeholder="Senha de acesso"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">Perfil / Permissão</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-blue-550 focus:outline-hidden"
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Financeiro">Financeiro</option>
                        <option value="Secretaria">Secretaria</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                      Salvar Cadastro
                    </button>
                  </div>
                </form>
              )}

              {/* Collaborators List */}
              <div className="space-y-2">
                {users.map((item) => (
                  <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg text-xs flex flex-col gap-2.5 transition hover:bg-slate-100/50">
                    <div className="flex justify-between items-center gap-4 w-full">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#03045e]/10 text-[#03045e] font-bold text-xs flex items-center justify-center shrink-0">
                          {item.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 leading-tight">{item.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{item.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.role === 'Administrador' 
                            ? 'bg-rose-50 text-rose-700' 
                            : item.role === 'Financeiro' 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.role}
                        </span>
                        
                        {/* Action buttons */}
                        <button
                          onClick={() => {
                            setEditingPasswordUserId(editingPasswordUserId === item.id ? null : item.id);
                            setNewPasswordValue('');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title="Alterar Senha"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteColaborador(item.id, item.name)}
                          className="p-1 text-rose-450 hover:text-rose-600 text-rose-400 transition cursor-pointer"
                          title="Excluir Colaborador"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline password edit form */}
                    {editingPasswordUserId === item.id && (
                      <div className="mt-1 pt-2 border-t border-slate-200/50 flex gap-2 items-center">
                        <div className="flex-1 max-w-xs">
                          <input
                            type="password"
                            placeholder="Nova senha para este usuário"
                            value={newPasswordValue}
                            onChange={(e) => setNewPasswordValue(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg text-[10px] p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                            required
                          />
                        </div>
                        <button
                          onClick={() => handleUpdatePassword(item.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-2 rounded-lg transition cursor-pointer"
                        >
                          Alterar Senha
                        </button>
                        <button
                          onClick={() => setEditingPasswordUserId(null)}
                          className="text-slate-400 hover:text-slate-650 text-slate-500 hover:text-slate-700 text-[10px] cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: Polos Acadêmicos */}
          {activeSubTab === 'POLOS' && (
            <div className="space-y-4">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-sm font-bold text-gray-900">Polos Acadêmicos (Cidades)</h3>
                <p className="text-xs text-gray-400">Cadastre e gerencie as cidades onde existem turmas presenciais ou oferta de ensino</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Adicionar Polo */}
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl h-fit">
                  <p className="text-xs font-bold text-gray-800">Cadastrar Novo Polo</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Polo (ex: Floriano)"
                      value={novoPoloNome}
                      onChange={(e) => setNovoPoloNome(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <button
                      onClick={handleAddPolo}
                      className="bg-[#03045e] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">Opcional: Você também pode cadastrar alunos na modalidade Online independente do polo.</p>
                </div>

                {/* Lista de Polos */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  <p className="text-xs font-bold text-gray-800 mb-1">Polos Cadastrados ({polos.length})</p>
                  {polos.map((polo) => {
                    const qtdAlunos = alunos.filter(a => a.polo === polo).length;
                    return (
                      <div key={polo} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs flex justify-between items-center transition hover:bg-slate-100/50">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-[#03045e]/10 rounded text-[#03045e]">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{polo}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{qtdAlunos} {qtdAlunos === 1 ? 'estudante' : 'estudantes'} vinculado(s)</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeletePolo(polo, qtdAlunos)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                          title="Excluir Polo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Cursos Acadêmicos */}
          {activeSubTab === 'CURSOS' && (
            <div className="space-y-4">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-sm font-bold text-gray-900">Cursos Acadêmicos</h3>
                <p className="text-xs text-gray-400">Cadastre e gerencie os cursos oferecidos para seleção no cadastro de alunos</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Adicionar Curso */}
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl h-fit">
                  <p className="text-xs font-bold text-gray-800">Cadastrar Novo Curso</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Curso (ex: Pós-Graduação em ABA)"
                      value={novoCursoNome}
                      onChange={(e) => setNovoCursoNome(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <button
                      onClick={handleAddCurso}
                      className="bg-[#03045e] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Cursos */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  <p className="text-xs font-bold text-gray-800 mb-1">Cursos Cadastrados ({cursos.length})</p>
                  {cursos.map((curso) => {
                    const qtdAlunos = alunos.filter(a => a.curso === curso).length;
                    return (
                      <div key={curso} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs flex justify-between items-center transition hover:bg-slate-100/50">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <div className="p-1.5 bg-[#03045e]/10 rounded text-[#03045e] shrink-0">
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-800 truncate" title={curso}>{curso}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{qtdAlunos} {qtdAlunos === 1 ? 'estudante' : 'estudantes'} vinculado(s)</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCurso(curso, qtdAlunos)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer shrink-0"
                          title="Excluir Curso"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SubTab 2: LGPD */}
          {activeSubTab === 'LGPD' && (
            <div className="space-y-5">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-sm font-bold text-gray-900">Adequação à LGPD (Lei Geral de Proteção de Dados)</h3>
                <p className="text-xs text-gray-400">Garanta que a automação e coleta de dados esteja em conformidade jurídica brasileira</p>
              </div>

              <div className="space-y-4">
                {/* Rule toggle 1 */}
                <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-slate-50/50">
                  <input 
                    type="checkbox" 
                    id="consent-check" 
                    checked={lgpdConsent}
                    onChange={(e) => {
                      setLgpdConsent(e.target.checked);
                      onPostAlert(`Configuração LGPD de Consentimento Ativa: ${e.target.checked}`, 'success');
                    }}
                    className="h-4.5 w-4.5 text-[#03045e] border-gray-300 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                  <div className="text-xs">
                    <label htmlFor="consent-check" className="font-bold text-gray-800 cursor-pointer block mb-0.5">
                      Consentimento de Disparo por WhatsApp
                    </label>
                    <span className="text-gray-500 leading-relaxed block font-medium">
                      O robô de Evolution-API só enviará a cobrança da parcela se o estudante der o opt-in de recebimento durante a efetivação da matrícula na secretaria.
                    </span>
                  </div>
                </div>

                {/* Rule toggle 2 */}
                <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-slate-50/50">
                  <input 
                    type="checkbox" 
                    id="anon-check" 
                    checked={lgpdAnonCpf}
                    onChange={(e) => {
                      setLgpdAnonCpf(e.target.checked);
                      onPostAlert(`Mascaramento de CPFs históricos: ${e.target.checked ? 'Habilitado' : 'Desabilitado'}`, 'success');
                    }}
                    className="h-4.5 w-4.5 text-[#03045e] border-gray-300 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                  <div className="text-xs">
                    <label htmlFor="anon-check" className="font-bold text-gray-800 cursor-pointer block mb-0.5">
                      Anonimização de Clientes Inativos (Após quitação total de débitos em 5 anos)
                    </label>
                    <span className="text-gray-500 leading-relaxed block font-medium">
                      Estudantes graduados e sem nenhum título financeiro em aberto por mais de 5 anos letivos terão o CPF e e-mail excluídos de forma segura e automatizada do LeadConnector/banco sentidos.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 3: Appearance */}
          {activeSubTab === 'APPEARANCE' && (
            <div className="space-y-4">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-sm font-bold text-gray-900">Customização e Identificação de Marca</h3>
                <p className="text-xs text-gray-400">Gerencie tons heráldicos e logotipo da sua instituição</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-[#03045e]/5 rounded-xl border border-[#03045e]/10 space-y-2">
                    <span className="h-5 w-5 rounded bg-[#03045e] block border shadow-xs" />
                    <div>
                      <p className="font-bold text-gray-800">Azul Principal FAEPI</p>
                      <span className="font-mono text-[10px] text-gray-500 font-semibold block mt-0.5">#03045e</span>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-2">
                    <span className="h-5 w-5 rounded bg-[#ff8000] block border shadow-xs" />
                    <div>
                      <p className="font-bold text-gray-800">Laranja Secundário Sentidos</p>
                      <span className="font-mono text-[10px] text-gray-500 font-semibold block mt-0.5">#ff8000</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 text-slate-500 leading-relaxed text-xs bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="font-bold text-slate-800 block mb-0.5">Nota de Estilo:</span>
                  <span>A paleta e tipografia Inter estão preparadas de forma robusta e otimizada com suporte para heranças de tags css dark e light para implementações futuras em seu servidor Node.js.</span>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 4: Backups & Restores */}
          {activeSubTab === 'RESTORE' && (
            <div className="space-y-4">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-sm font-bold text-gray-900">Cópia de Segurança & Integridade de Dados</h3>
                <p className="text-xs text-gray-400">Proteja-se contra perdas de dados e mantenha dumps em segurança externa</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50/20 border border-blue-100/50 rounded-xl flex items-center justify-between gap-4">
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-gray-800">Backup Completo do Prontuário</p>
                    <p className="text-gray-500 font-medium">Contém alunos, todo o histórico financeiro e timeline de logs.</p>
                  </div>

                  <button
                    onClick={handleBackup}
                    className="bg-[#03045e] text-white hover:bg-[#03045e]/90 font-bold px-3 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shrink-0 shadow-md"
                  >
                    <HardDriveDownload className="h-4 w-4" />
                    <span>Realizar Exportação JSON</span>
                  </button>
                </div>

                {/* Reset Section */}
                <div className="p-4 bg-red-50/10 border border-red-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-red-800 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Limpar e Redefinir Banco de Dados
                    </p>
                    <p className="text-gray-500 font-medium">Apaga todos os dados correntes e recria os alunos, parcelas e logs iniciais de homologação. Um backup é gravado antes (database.boletos.backup.json).</p>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm("Atenção: Isso irá apagar todo o progresso atual e redefinir o banco de dados para o estado original de demonstração. Deseja prosseguir?")) {
                        onResetDatabase();
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Redefinir Banco</span>
                  </button>
                </div>

                {/* Clear Database for Production Section */}
                <div className="p-4 bg-orange-50/10 border border-orange-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-orange-850 flex items-center gap-1.5" style={{ color: '#c05621' }}>
                      <Trash2 className="h-4 w-4 text-orange-600" />
                      Limpar Dados de Produção (Blank Slate)
                    </p>
                    <p className="text-gray-500 font-medium">Exclui todos os Alunos, Parcelas, Mensagens e Logs correntes. Preserva os modelos de réguas, polos e chaves de API. Um backup é gravado antes.</p>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm("Atenção: Isso excluirá permanentemente todos os Alunos, Parcelas, Mensagens e Logs para iniciar o sistema em produção com dados reais. Suas réguas de cobrança e chaves de API serão preservadas. Um backup será gravado antes. Deseja prosseguir?")) {
                        onClearDatabase();
                      }
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Limpar para Produção</span>
                  </button>
                </div>


                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/10 flex gap-3 text-xs leading-relaxed text-gray-600">
                  <Lock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-800 block mb-0.5">Segurança dos dados educacionais</span>
                    Os dumps de banco são protegidos por criptografia simétrica AES-256 e podem ser integrados em rotinas diárias no Google Cloud Bucket para conformidade com a LGPD.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 5: APIS */}
          {activeSubTab === 'APIS' && (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Configurações de Integrações & APIs</h3>
                  <p className="text-xs text-gray-400">Configure chaves de acesso e modelos de IA para o atendimento automatizado</p>
                </div>
                
                {/* Active Provider Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Provedor Ativo:</label>
                  <select
                    value={activeProvider}
                    onChange={(e) => {
                      const prov = e.target.value;
                      setActiveProvider(prov);
                      safeSetItem('sentidos_ai_provider', prov);
                      onPostAlert(`Provedor de IA ativo alterado para ${prov.toUpperCase()}!`, 'success');
                    }}
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-[#03045e] focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                    <option value="groq">Groq</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {/* Google Gemini Card */}
                <div className={`p-4 rounded-xl border transition ${activeProvider === 'gemini' ? 'bg-orange-50/10 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                      <Key className="h-4 w-4 text-[#ff8000]" />
                      <span>Google Gemini API</span>
                    </div>
                    {activeProvider === 'gemini' && (
                      <span className="text-[9px] bg-orange-100 text-orange-850 px-2 py-0.5 rounded-full font-bold uppercase">Ativo</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-3">
                    Recomendado. Suporta leitura direta de PDF nativa. Utiliza o modelo <code>gemini-2.5-flash</code>. Obtenha no <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800">Google AI Studio</a>.
                  </p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="password"
                      placeholder="Cole sua VITE_GEMINI_API_KEY aqui (ex: AIzaSy...)"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                    />
                    <button
                      onClick={() => {
                        safeSetItem('sentidos_gemini_api_key', geminiKey);
                        onPostAlert('Chave de API do Gemini salva com sucesso!', 'success');
                      }}
                      className="bg-[#03045e] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </div>

                {/* OpenAI Card */}
                <div className={`p-4 rounded-xl border transition ${activeProvider === 'openai' ? 'bg-orange-50/10 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                      <Key className="h-4 w-4 text-emerald-600" />
                      <span>OpenAI API</span>
                    </div>
                    {activeProvider === 'openai' && (
                      <span className="text-[9px] bg-orange-100 text-orange-850 px-2 py-0.5 rounded-full font-bold uppercase">Ativo</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-3">
                    Utiliza extração de texto PDF via PDF.js. Obtenha no <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800">OpenAI Platform</a>.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Chave de API</label>
                      <input 
                        type="password"
                        placeholder="sk-proj-..."
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Modelo</label>
                      <input 
                        type="text"
                        placeholder="gpt-4o-mini"
                        value={openaiModel}
                        onChange={(e) => setOpenaiModel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => {
                        safeSetItem('sentidos_openai_api_key', openaiKey);
                        safeSetItem('sentidos_openai_model', openaiModel);
                        onPostAlert('Configurações da OpenAI salvas com sucesso!', 'success');
                      }}
                      className="bg-[#03045e] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                    >
                      Salvar OpenAI
                    </button>
                  </div>
                </div>

                {/* Groq Card */}
                <div className={`p-4 rounded-xl border transition ${activeProvider === 'groq' ? 'bg-orange-50/10 border-orange-200' : 'bg-slate-50 border-slate-105 bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                      <Key className="h-4 w-4 text-purple-600" />
                      <span>Groq API</span>
                    </div>
                    {activeProvider === 'groq' && (
                      <span className="text-[9px] bg-orange-100 text-orange-850 px-2 py-0.5 rounded-full font-bold uppercase">Ativo</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-3">
                    Ultra veloz. Utiliza extração de texto PDF via PDF.js. Obtenha no <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800">Groq Console</a>.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Chave de API</label>
                      <input 
                        type="password"
                        placeholder="gsk_..."
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Modelo</label>
                      <input 
                        type="text"
                        placeholder="llama-3.3-70b-specdec"
                        value={groqModel}
                        onChange={(e) => setGroqModel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => {
                        safeSetItem('sentidos_groq_api_key', groqKey);
                        safeSetItem('sentidos_groq_model', groqModel);
                        onPostAlert('Configurações da Groq salvas com sucesso!', 'success');
                      }}
                      className="bg-[#03045e] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                    >
                      Salvar Groq
                    </button>
                  </div>
                </div>

                {/* OpenRouter Card */}
                <div className={`p-4 rounded-xl border transition ${activeProvider === 'openrouter' ? 'bg-orange-50/10 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                      <Key className="h-4 w-4 text-blue-600" />
                      <span>OpenRouter API</span>
                    </div>
                    {activeProvider === 'openrouter' && (
                      <span className="text-[9px] bg-orange-100 text-orange-850 px-2 py-0.5 rounded-full font-bold uppercase">Ativo</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-3">
                    Acesso a dezenas de modelos (incluindo Gemini e LLaMA). Obtenha no <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-800">OpenRouter</a>.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Chave de API</label>
                      <input 
                        type="password"
                        placeholder="sk-or-v1-..."
                        value={openrouterKey}
                        onChange={(e) => setOpenrouterKey(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Modelo</label>
                      <input 
                        type="text"
                        placeholder="google/gemini-2.5-flash"
                        value={openrouterModel}
                        onChange={(e) => setOpenrouterModel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => {
                        safeSetItem('sentidos_openrouter_api_key', openrouterKey);
                        safeSetItem('sentidos_openrouter_model', openrouterModel);
                        onPostAlert('Configurações da OpenRouter salvas com sucesso!', 'success');
                      }}
                      className="bg-[#03045e] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                    >
                      Salvar OpenRouter
                    </button>
                  </div>
                </div>

                {/* Evolution API WhatsApp Card */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/5">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                      <span>Evolution API (WhatsApp)</span>
                    </div>
                    {evolutionUrl && evolutionInstance && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">Configurado</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-3">
                    Integração com o gateway de WhatsApp. Permite o disparo real de mensagens e leitura de QR Code.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">URL da API (Base URL)</label>
                      <input 
                        type="text"
                        placeholder="https://api.seuservidor.com ou http://localhost:8080"
                        value={evolutionUrl}
                        onChange={(e) => setEvolutionUrl(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Nome da Instância</label>
                      <input 
                        type="text"
                        placeholder="Ex: sentidos-financeiro"
                        value={evolutionInstance}
                        onChange={(e) => setEvolutionInstance(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Token de API Global (Global API Key)</label>
                      <input 
                        type="password"
                        placeholder="Cole a chave global da Evolution API"
                        value={evolutionGlobalToken}
                        onChange={(e) => setEvolutionGlobalToken(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 uppercase font-bold mb-1">Token da Instância (Opcional)</label>
                      <input 
                        type="password"
                        placeholder="Usa Token Global se deixado em branco"
                        value={evolutionInstanceToken}
                        onChange={(e) => setEvolutionInstanceToken(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={handleTestEvolutionConnection}
                      disabled={checkingConnection}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 border border-emerald-250 disabled:opacity-50"
                    >
                      {checkingConnection ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Testando...</span>
                        </>
                      ) : (
                        <>
                          <Globe className="h-3.5 w-3.5" />
                          <span>Testar Conexão WhatsApp</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        safeSetItem('sentidos_evolution_url', evolutionUrl.trim());
                        safeSetItem('sentidos_evolution_global_token', evolutionGlobalToken.trim());
                        safeSetItem('sentidos_evolution_instance', evolutionInstance.trim());
                        safeSetItem('sentidos_evolution_instance_token', evolutionInstanceToken.trim());
                        onPostAlert('Configurações da Evolution API salvas com sucesso!', 'success');
                      }}
                      className="bg-[#03045e] hover:bg-blue-900 text-white font-bold px-5 py-2 rounded-lg text-xs transition cursor-pointer"
                    >
                      Salvar Evolution API
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 flex gap-3 text-xs leading-relaxed text-gray-650 text-gray-600">
                  <HelpCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-800 block mb-0.5">Modo de Simulação</span>
                    Caso nenhum provedor ativo tenha sua respectiva chave de API configurada, o sistema continuará operando no modo simulador local inteligente de alta fidelidade para testes e validações.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 6: Notificações & SMTP */}
          {activeSubTab === 'NOTIFICACOES' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-900">Configurações de Notificações, SMTP e WhatsApp da Equipe</h3>
                <p className="text-xs text-gray-400">Configure as credenciais do Zoho Zeptomail e as preferências dos alertas operacionais</p>
              </div>

              <div className="space-y-6">
                
                {/* SMTP Config Card */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4.5 w-4.5 text-indigo-650" />
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Integração de E-mail (Zoho Zeptomail)</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={smtpActive}
                        onChange={(e) => setSmtpActive(e.target.checked)}
                        className="h-4 w-4 text-indigo-650 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Ativar Envio de E-mails</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Servidor SMTP (Host)</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.zeptomail.com"
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Porta SMTP</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        placeholder="587"
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">SSL / TLS Seguro</label>
                      <div className="h-10 flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={smtpSecure}
                            onChange={(e) => setSmtpSecure(e.target.checked)}
                            className="h-4.5 w-4.5 text-indigo-650 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <span>Usar SSL/TLS Seguro</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Nome do Usuário</label>
                      <input
                        type="text"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="emailapikey"
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <span className="text-[9px] text-gray-400 mt-1 block leading-tight">
                        Para o Zoho Zeptomail, use sempre <code>emailapikey</code> como usuário.
                      </span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Senha (Token Zeptomail)</label>
                      <input
                        type="password"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="Insira seu Token Zeptomail"
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <span className="text-[9px] text-gray-400 mt-1 block leading-tight">
                        O token de envio gerado no painel do Zoho Zeptomail.
                      </span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">E-mail do Remetente (From)</label>
                      <input
                        type="email"
                        value={smtpFromEmail}
                        onChange={(e) => setSmtpFromEmail(e.target.value)}
                        placeholder="financeiro@institutosentidos.com.br"
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Nome de Exibição do Remetente</label>
                      <input
                        type="text"
                        value={smtpFromName}
                        onChange={(e) => setSmtpFromName(e.target.value)}
                        placeholder="Instituto Sentidos"
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Test SMTP connection section */}
                  <div className="mt-4 pt-4 border-t border-slate-200/50 bg-indigo-50/20 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-end sm:items-center gap-3">
                    <div className="text-xs min-w-0 flex-1">
                      <p className="font-bold text-indigo-900">Validar Configurações SMTP</p>
                      <p className="text-slate-500 mt-0.5 font-medium">Insira um e-mail de destino e clique em testar para disparar um e-mail de verificação.</p>
                      <div className="mt-2 max-w-sm">
                        <input
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="Digite o e-mail de destino do teste"
                          className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={sendingTest}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold px-4 py-2.2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 border border-indigo-200 disabled:opacity-50"
                    >
                      {sendingTest ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Testar Envio</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Team Alertas Card */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                    <Smartphone className="h-4.5 w-4.5 text-emerald-650" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Notificação para Equipe Interna</span>
                  </div>

                  <div className="max-w-md">
                    <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">WhatsApp da Equipe Interna</label>
                    <input
                      type="text"
                      value={teamPhone}
                      onChange={(e) => setTeamPhone(e.target.value)}
                      placeholder="+55 (86) 99999-9999"
                      className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    />
                    <span className="text-[10px] text-gray-400 mt-1.5 block leading-relaxed font-sans">
                      Número de WhatsApp do setor operacional/financeiro para receber alertas da régua de cobrança configurados para a <strong>Equipe Interna</strong>.
                    </span>
                  </div>
                </div>

                {/* Anti-Ban Dispatch Interval Card */}
                <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-amber-200/50 pb-2">
                    <Clock className="h-4.5 w-4.5 text-amber-600" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Intervalo Anti-Ban de Disparos WhatsApp</span>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Para evitar banimento da conta pelo Meta, o sistema aguarda um tempo aleatório entre cada mensagem enviada no disparo em lote.
                    Configure o intervalo mínimo e máximo (em segundos) para equilibrar velocidade e segurança.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Intervalo Mínimo (segundos)</label>
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={dispatchMinInterval}
                        onChange={(e) => {
                          const val = Math.max(5, Number(e.target.value));
                          setDispatchMinInterval(val);
                          if (val > dispatchMaxInterval) setDispatchMaxInterval(val + 5);
                        }}
                        className="w-full bg-white border border-amber-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
                      />
                      <span className="text-[9px] text-gray-400 mt-1 block">
                        Tempo mínimo de espera entre cada mensagem. Recomendado: 15s ou mais.
                      </span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Intervalo Máximo (segundos)</label>
                      <input
                        type="number"
                        min={10}
                        max={600}
                        value={dispatchMaxInterval}
                        onChange={(e) => {
                          const val = Math.max(Number(dispatchMinInterval) + 5, Number(e.target.value));
                          setDispatchMaxInterval(val);
                        }}
                        className="w-full bg-white border border-amber-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
                      />
                      <span className="text-[9px] text-gray-400 mt-1 block">
                        Tempo máximo de espera entre cada mensagem. Recomendado: 45s ou mais.
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5 items-start text-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-800">Intervalo atual:</p>
                      <p className="text-amber-700 mt-0.5 font-medium">
                        Cada mensagem será enviada com um delay aleatório entre <strong>{dispatchMinInterval}s</strong> e <strong>{dispatchMaxInterval}s</strong>.
                        Para um lote de 50 alunos, o disparo poderá levar entre <strong>{Math.round(dispatchMinInterval * 50 / 60)} min</strong> e <strong>{Math.round(dispatchMaxInterval * 50 / 60)} min</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save All Notificacoes Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveNotificacoes}
                    className="bg-[#03045e] hover:bg-blue-900 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition cursor-pointer shadow-md"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer warning info */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-right">
            <span className="text-[10px] text-gray-400 font-medium">Sentidos Cobranças &middot; Versão 1.5.0-Release &middot; Parceria FAEPI</span>
          </div>
        </div>

      </div>
    </div>
  );
}
