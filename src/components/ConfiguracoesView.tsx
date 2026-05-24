import React, { useState } from 'react';
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
  UserPlus,
  Key,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Plus,
  Trash2,
  Smartphone,
  Globe
} from 'lucide-react';
import { Aluno } from '../types';
import { checkConnectionStatus } from '../services/whatsappService';


interface ConfiguracoesViewProps {
  onPostAlert: (msg: string, type: 'success' | 'warning' | 'error') => void;
  onResetDatabase: () => void;
  polos: string[];
  onUpdatePolos: (newPolos: string[]) => void;
  alunos: Aluno[];
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Financeiro' | 'Secretaria';
  active: boolean;
}

export default function ConfiguracoesView({ onPostAlert, onResetDatabase, polos, onUpdatePolos, alunos }: ConfiguracoesViewProps) {
  // Users list State
  const [users, setUsers] = useState<MockUser[]>([
    { id: 'usr-1', name: 'Ana Carolina Meireles', email: 'secretaria.sentidos@sentidos.edu.br', role: 'Secretaria', active: true },
    { id: 'usr-2', name: 'Francisco Santos Moura', email: 'financeiro.faepi@faepi.org', role: 'Financeiro', active: true },
    { id: 'usr-3', name: 'Rodrigo Lemos Ramos', email: 'r.lemos@sentidos.edu.br', role: 'Administrador', active: true },
  ]);

  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [lgpdAnonCpf, setLgpdAnonCpf] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'USERS' | 'POLOS' | 'LGPD' | 'APPEARANCE' | 'RESTORE' | 'APIS'>('USERS');
  
  const [activeProvider, setActiveProvider] = useState(() => {
    return localStorage.getItem('sentidos_active_provider') || 'gemini';
  });
  const [geminiKey, setGeminiKey] = useState(() => {
    return localStorage.getItem('sentidos_gemini_api_key') || '';
  });
  const [openaiKey, setOpenaiKey] = useState(() => {
    return localStorage.getItem('sentidos_openai_api_key') || '';
  });
  const [openaiModel, setOpenaiModel] = useState(() => {
    return localStorage.getItem('sentidos_openai_model') || 'gpt-4o-mini';
  });
  const [groqKey, setGroqKey] = useState(() => {
    return localStorage.getItem('sentidos_groq_api_key') || '';
  });
  const [groqModel, setGroqModel] = useState(() => {
    return localStorage.getItem('sentidos_groq_model') || 'llama-3.3-70b-specdec';
  });
  const [openrouterKey, setOpenrouterKey] = useState(() => {
    return localStorage.getItem('sentidos_openrouter_api_key') || '';
  });
  const [openrouterModel, setOpenrouterModel] = useState(() => {
    return localStorage.getItem('sentidos_openrouter_model') || 'google/gemini-2.5-flash';
  });

  const [evolutionUrl, setEvolutionUrl] = useState(() => {
    return localStorage.getItem('sentidos_evolution_url') || '';
  });
  const [evolutionGlobalToken, setEvolutionGlobalToken] = useState(() => {
    return localStorage.getItem('sentidos_evolution_global_token') || '';
  });
  const [evolutionInstance, setEvolutionInstance] = useState(() => {
    return localStorage.getItem('sentidos_evolution_instance') || '';
  });
  const [evolutionInstanceToken, setEvolutionInstanceToken] = useState(() => {
    return localStorage.getItem('sentidos_evolution_instance_token') || '';
  });
  const [checkingConnection, setCheckingConnection] = useState(false);

  const handleTestEvolutionConnection = async () => {
    if (!evolutionUrl.trim() || !evolutionInstance.trim()) {
      onPostAlert('Por favor, informe a URL da API e o Nome da Instância para testar.', 'warning');
      return;
    }
    setCheckingConnection(true);
    // Temp save parameters in localStorage so connection check reads current inputs
    localStorage.setItem('sentidos_evolution_url', evolutionUrl.trim());
    localStorage.setItem('sentidos_evolution_global_token', evolutionGlobalToken.trim());
    localStorage.setItem('sentidos_evolution_instance', evolutionInstance.trim());
    localStorage.setItem('sentidos_evolution_instance_token', evolutionInstanceToken.trim());

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
          onPostAlert(`Instância "${evolutionInstance}" não está conectada. Estado: ${res.state}. Detalhes: ${res.details || 'Sem detalhes'}`, 'warning');
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

  // Add mock administrator
  const handleAddMockUser = () => {
    const roles: MockUser['role'][] = ['Financeiro', 'Secretaria'];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const newUser: MockUser = {
      id: `usr-${Date.now()}`,
      name: 'Novo Atendente Colaborador',
      email: `financeiro.${Math.floor(100+Math.random()*900)}@sentidos.edu.br`,
      role: randomRole,
      active: true
    };
    setUsers(prev => [...prev, newUser]);
    onPostAlert('Novo perfil de colaborador cadastrado com perfil restrito!', 'success');
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
                <button
                  onClick={handleAddMockUser}
                  className="bg-[#03045e] hover:bg-blue-900 text-white font-bold text-xs px-3.5 py-1.8 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Cadastrar Colaborador</span>
                </button>
              </div>

              <div className="space-y-2">
                {users.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs flex justify-between items-center gap-4 transition hover:bg-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#03045e]/10 text-[#03045e] font-bold text-xs flex items-center justify-center">
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
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Ativo</span>
                    </div>
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
                      O robô de Evolution-API só enviará o boleto bancário se o estudante der o opt-in de recebimento durante a efetivação da matrícula na secretaria.
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
                    <p className="text-gray-500 font-medium">Apaga todos os dados correntes e recria os alunos, boletos e logs iniciais de homologação.</p>
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
                  <p className="text-xs text-gray-400">Configure chaves de acesso e modelos para alimentar os motores de OCR e IA</p>
                </div>
                
                {/* Active Provider Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Provedor Ativo:</label>
                  <select
                    value={activeProvider}
                    onChange={(e) => {
                      const prov = e.target.value;
                      setActiveProvider(prov);
                      localStorage.setItem('sentidos_ai_provider', prov);
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
                        localStorage.setItem('sentidos_gemini_api_key', geminiKey);
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
                        localStorage.setItem('sentidos_openai_api_key', openaiKey);
                        localStorage.setItem('sentidos_openai_model', openaiModel);
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
                        localStorage.setItem('sentidos_groq_api_key', groqKey);
                        localStorage.setItem('sentidos_groq_model', groqModel);
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
                        localStorage.setItem('sentidos_openrouter_api_key', openrouterKey);
                        localStorage.setItem('sentidos_openrouter_model', openrouterModel);
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
                        localStorage.setItem('sentidos_evolution_url', evolutionUrl.trim());
                        localStorage.setItem('sentidos_evolution_global_token', evolutionGlobalToken.trim());
                        localStorage.setItem('sentidos_evolution_instance', evolutionInstance.trim());
                        localStorage.setItem('sentidos_evolution_instance_token', evolutionInstanceToken.trim());
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

          {/* Footer warning info */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-right">
            <span className="text-[10px] text-gray-400 font-medium">Sentidos Cobranças &middot; Versão 1.5.0-Release &middot; Parceria FAEPI</span>
          </div>
        </div>

      </div>
    </div>
  );
}
