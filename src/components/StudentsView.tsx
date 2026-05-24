import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserSquare2, 
  MessageSquare, 
  Eye, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Ban, 
  UserPlus,
  X,
  Trash2
} from 'lucide-react';
import { Aluno } from '../types';

interface StudentsViewProps {
  alunos: Aluno[];
  polos: string[];
  onSelectStudent: (studentId: string) => void;
  onFastWhatsAppNotification: (student: Aluno) => void;
  onAddAlunos: (novosAlunos: Omit<Aluno, 'id' | 'matricula' | 'valorPendente' | 'statusFinanceiro' | 'cadastroData'>[]) => Aluno[];
  onDeleteAluno: (alunoId: string) => void;
  onToggleCobrancaAutomatica: (alunoId: string) => void;
}

export default function StudentsView({ 
  alunos, 
  polos,
  onSelectStudent, 
  onFastWhatsAppNotification, 
  onAddAlunos,
  onDeleteAluno,
  onToggleCobrancaAutomatica
}: StudentsViewProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCurso, setFilterCurso] = useState<string>('ALL');
  const [filterModalidade, setFilterModalidade] = useState<string>('ALL');

  // Modal & Tabs
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'INDIVIDUAL' | 'MASSA'>('INDIVIDUAL');
  
  // Individual fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [curso, setCurso] = useState('');
  const [polo, setPolo] = useState(polos[0] || 'Teresina (Sede)');
  const [modalidade, setModalidade] = useState<'Presencial' | 'Online'>('Presencial');
  
  // Bulk fields
  const [bulkText, setBulkText] = useState('');
  const [bulkParsed, setBulkParsed] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const resetForm = () => {
    setNome('');
    setEmail('');
    setCpf('');
    setWhatsapp('');
    setCurso('');
    setPolo(polos[0] || 'Teresina (Sede)');
    setModalidade('Presencial');
    setBulkText('');
    setBulkParsed([]);
    setBulkError(null);
  };

  const handleParseBulk = (text: string) => {
    setBulkError(null);
    if (!text.trim()) {
      setBulkParsed([]);
      return;
    }
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedList: any[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/[;,]/).map(p => p.trim());
      
      if (parts.length < 5) {
        if (i === 0 && line.toLowerCase().includes('nome')) {
          continue;
        }
        setBulkError(`Linha ${i + 1} inválida: Deve possuir pelo menos 5 campos separados por vírgula ou ponto-e-vírgula (Nome, E-mail, CPF, WhatsApp, Curso).`);
        return;
      }
      
      const [nomeVal, emailVal, cpfVal, whatsappVal, cursoVal, poloVal, modalidadeVal] = parts;
      
      let modVal: 'Presencial' | 'Online' = 'Presencial';
      if (modalidadeVal) {
        const cleanMod = modalidadeVal.trim().toLowerCase();
        if (cleanMod === 'online') {
          modVal = 'Online';
        }
      }
      
      parsedList.push({
        nome: nomeVal || '',
        email: emailVal || '',
        cpf: cpfVal || '',
        whatsapp: whatsappVal || '',
        curso: cursoVal || '',
        polo: poloVal || (polos[0] || 'Teresina (Sede)'),
        modalidade: modVal
      });
    }
    
    setBulkParsed(parsedList);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkText(text);
      handleParseBulk(text);
    };
    reader.readAsText(file);
  };

  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !cpf || !whatsapp || !curso) return;

    onAddAlunos([{
      nome,
      email,
      cpf,
      whatsapp,
      curso,
      polo,
      modalidade
    }]);

    setShowModal(false);
    resetForm();
  };

  const handleBulkSubmit = () => {
    if (bulkParsed.length === 0 || bulkError) return;

    onAddAlunos(bulkParsed);
    setShowModal(false);
    resetForm();
  };

  // Fast courses lookup list
  const coursesList = useMemo(() => {
    const list = new Set<string>();
    alunos.forEach(a => list.add(a.curso));
    return Array.from(list);
  }, [alunos]);

  // Filter students based on state
  const filteredStudents = useMemo(() => {
    return alunos.filter(student => {
      const matchesSearch = 
        student.nome.toLowerCase().includes(search.toLowerCase()) ||
        student.cpf.includes(search) ||
        student.matricula.includes(search);
      
      const matchesStatus = 
        filterStatus === 'ALL' || student.statusFinanceiro === filterStatus;
      
      const matchesCurso = 
        filterCurso === 'ALL' || student.curso === filterCurso;

      const matchesModalidade = 
        filterModalidade === 'ALL' || student.modalidade === filterModalidade;

      return matchesSearch && matchesStatus && matchesCurso && matchesModalidade;
    });
  }, [alunos, search, filterStatus, filterCurso, filterModalidade]);

  // Get financial status styles
  const getStatusBadge = (status: Aluno['statusFinanceiro']) => {
    switch(status) {
      case 'EM_DIA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            Em Dia
          </span>
        );
      case 'PENDENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Pendente
          </span>
        );
      case 'INADIMPLENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-250">
            <XCircle className="h-3 w-3 text-rose-600" />
            Inadimplente
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title block with helper stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Estudantes Cadastrados</h1>
          <p className="text-xs text-gray-400">Banco de alunos e status financeiro consolidado em parceria com a Secretaria e FAEPI</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#03045e] hover:bg-blue-900 text-[#f8fafc] font-bold text-xs px-3.5 py-1.8 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0 mr-2 hover:scale-[1.02] active:scale-[0.98] duration-250"
          >
            <UserPlus className="h-4 w-4 text-[#ff8000]" />
            <span>Cadastrar Aluno</span>
          </button>

          <div className="bg-white px-3 py-1.8 rounded-lg border border-gray-100 shadow-3xs text-xs">
            <span className="text-gray-450 text-gray-500">Total de Alunos:</span>{' '}
            <strong className="text-gray-900">{alunos.length}</strong>
          </div>
          <div className="bg-[#03045e]/5 px-3 py-1.8 rounded-lg border border-[#03045e]/10 text-xs">
            <span className="text-gray-505 text-gray-600">Inadimplentes Ativos:</span>{' '}
            <strong className="text-red-700">{alunos.filter(a => a.statusFinanceiro === 'INADIMPLENTE').length}</strong>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF ou matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#03045e] focus:bg-white transition"
          />
        </div>

        {/* Action Selects */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Status Select */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs text-gray-700">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-medium"
            >
              <option value="ALL">Todos status</option>
              <option value="EM_DIA">Status: Em Dia</option>
              <option value="PENDENTE">Status: Pendente</option>
              <option value="INADIMPLENTE">Status: Inadimplente</option>
            </select>
          </div>

          {/* Course filter select */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs text-gray-700 max-w-[200px] md:max-w-xs">
            <select 
              value={filterCurso}
              onChange={(e) => setFilterCurso(e.target.value)}
              className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-medium truncate w-full"
            >
              <option value="ALL">Todos os cursos</option>
              {coursesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Modalidade filter select */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs text-gray-700">
            <select 
              value={filterModalidade}
              onChange={(e) => setFilterModalidade(e.target.value)}
              className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-medium"
            >
              <option value="ALL">Todas modalidades</option>
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {/* Quick Clear Button */}
          {(search || filterStatus !== 'ALL' || filterCurso !== 'ALL' || filterModalidade !== 'ALL') && (
            <button 
              onClick={() => {
                setSearch('');
                setFilterStatus('ALL');
                setFilterCurso('ALL');
                setFilterModalidade('ALL');
              }}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-255 text-gray-600 rounded-lg text-xs font-semibold cursor-pointer transition"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid view/Datatable */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#03045e]/5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">Aluno</th>
                <th className="py-4 px-4">Matrícula / CPF</th>
                <th className="py-4 px-4">Curso / Especialidade</th>
                <th className="py-4 px-4">WhatsApp</th>
                <th className="py-4 px-4 text-center">Régua Auto</th>
                <th className="py-4 px-4 text-center">Situação Financeira</th>
                <th className="py-4 px-4 text-right">Valor Pendente</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="text-xs hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                          alt={student.nome}
                          className="h-9 w-9 rounded-full object-cover border border-gray-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span onClick={() => onSelectStudent(student.id)} className="font-bold text-gray-900 hover:text-blue-700 cursor-pointer transition">
                              {student.nome}
                            </span>
                            {student.modalidade === 'Online' ? (
                              <span className="px-1.5 py-0.2 bg-orange-100 text-orange-700 border border-orange-200 rounded text-[9px] font-bold">Online</span>
                            ) : (
                              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 border border-blue-200 rounded text-[9px] font-bold">Presencial</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <p className="font-semibold text-gray-700 font-mono">{student.matricula}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{student.cpf}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="max-w-[200px] truncate">
                        <span className="font-semibold text-gray-700" title={student.curso}>{student.curso}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">Polo: {student.polo} • Parceria FAEPI</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-gray-600 whitespace-nowrap">
                      {student.whatsapp}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onToggleCobrancaAutomatica(student.id)}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            student.cobrancaAutomatica !== false ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={student.cobrancaAutomatica !== false ? 'Desativar régua automática' : 'Ativar régua automática'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              student.cobrancaAutomatica !== false ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-semibold ${student.cobrancaAutomatica !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {student.cobrancaAutomatica !== false ? 'Ativa' : 'Manual'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(student.statusFinanceiro)}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap font-bold text-gray-800 font-mono">
                      R$ {student.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* Detail Trigger */}
                        <button 
                          onClick={() => onSelectStudent(student.id)}
                          className="p-1.5 text-[#03045e] hover:bg-[#03045e]/10 rounded-md transition cursor-pointer"
                          title="Exibir Perfil & Histórico"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        
                        {/* Send Immediate WhatsApp Warning */}
                        <button 
                          onClick={() => onFastWhatsAppNotification(student)}
                          disabled={student.statusFinanceiro === 'EM_DIA'}
                          className={`p-1.5 rounded-md transition cursor-pointer ${
                            student.statusFinanceiro === 'EM_DIA'
                              ? 'text-gray-300 pointer-events-none'
                              : 'text-orange-500 hover:bg-orange-50'
                          }`}
                          title="Disparar Alerta WhatsApp"
                        >
                          <MessageSquare className="h-4.5 w-4.5" />
                        </button>

                        {/* Delete Student */}
                        <button 
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja excluir o estudante ${student.nome}? Esta ação é permanente e removerá todas as cobranças e logs de mensagens associados.`)) {
                              onDeleteAluno(student.id);
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition cursor-pointer"
                          title="Excluir Aluno"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserSquare2 className="h-8 w-8 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-500">Nenhum estudante foi encontrado</p>
                      <p className="text-xs text-gray-400">Tente ajustar a busca ou os termos de filtragem acadêmica.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro de Estudante */}
      {showModal && (
        <div className="fixed inset-0 bg-[#03045e]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#03045e] text-white">
              <div>
                <h3 className="font-bold text-sm">Cadastrar Novo Aluno</h3>
                <p className="text-[10px] text-gray-200 mt-0.5">Adicione dados individualmente ou importe em massa via arquivo CSV.</p>
              </div>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-gray-150 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setActiveTab('INDIVIDUAL')}
                className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'INDIVIDUAL' 
                    ? 'border-[#ff8000] text-[#03045e]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                Cadastro Individual
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MASSA')}
                className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'MASSA' 
                    ? 'border-[#ff8000] text-[#03045e]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                Importar em Massa (CSV/Texto)
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTab === 'INDIVIDUAL' ? (
                <form onSubmit={handleIndividualSubmit} id="form-individual" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Mariana Silva Santos"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#03045e]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mariana.silva@faepi.edu.br"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#03045e]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">CPF *</label>
                      <input
                        type="text"
                        required
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        placeholder="123.456.789-00"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#03045e]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+55 (86) 99876-5432"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#03045e]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Curso / Pós-Graduação *</label>
                      <input
                        type="text"
                        required
                        value={curso}
                        onChange={(e) => setCurso(e.target.value)}
                        placeholder="Ex: Pós-Graduação em Neuropsicologia Clínica"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#03045e]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Polo Acadêmico *</label>
                      <select
                        value={polo}
                        onChange={(e) => setPolo(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#03045e]"
                      >
                        {polos.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Modalidade *</label>
                      <select
                        value={modalidade}
                        onChange={(e) => setModalidade(e.target.value as 'Presencial' | 'Online')}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#03045e]"
                      >
                        <option value="Presencial">Presencial</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Cole linhas contendo dados separados por vírgula (<code>,</code>) ou ponto-e-vírgula (<code>;</code>) na ordem:<br />
                      <strong>Nome, E-mail, CPF, WhatsApp, Curso, Polo, Modalidade (Opcional - Presencial/Online)</strong>.
                    </p>
                    <p className="text-[10px] text-orange-600 font-semibold mt-1">
                      Exemplo: Mariana Silva, mariana@faepi.edu.br, 123.456.789-00, +55 (86) 99876-5432, Neuropsicologia, Teresina (Sede), Online
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="bg-gray-100 hover:bg-gray-255 text-gray-700 font-semibold text-xs px-3 py-2 rounded-lg cursor-pointer transition border border-gray-300">
                      <span>Selecionar Arquivo .CSV</span>
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {bulkParsed.length > 0 && (
                      <span className="text-[11px] text-emerald-600 font-bold">
                        {bulkParsed.length} registro(s) lido(s) com sucesso.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ou cole o conteúdo CSV aqui:</label>
                    <textarea
                      rows={5}
                      value={bulkText}
                      onChange={(e) => {
                        setBulkText(e.target.value);
                        handleParseBulk(e.target.value);
                      }}
                      placeholder="Nome, E-mail, CPF, WhatsApp, Curso, Polo, Modalidade&#10;João Pereira, joao@gmail.com, 111.222.333-44, +55 (86) 99123-4567, Psicopedagogia, Parnaíba, Online"
                      className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#03045e] placeholder:text-gray-300"
                    />
                  </div>

                  {/* Errors Block */}
                  {bulkError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                      {bulkError}
                    </div>
                  )}

                  {/* Bulk Preview Table */}
                  {bulkParsed.length > 0 && !bulkError && (
                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                        <strong className="text-[10px] text-gray-500 uppercase tracking-wider">Pré-visualização dos Dados ({bulkParsed.length})</strong>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-gray-100/50 text-gray-400 font-semibold border-b border-gray-100">
                              <th className="py-2 px-3">Nome</th>
                              <th className="py-2 px-3">CPF</th>
                              <th className="py-2 px-3">Curso</th>
                              <th className="py-2 px-3">Polo</th>
                              <th className="py-2 px-3">Modalidade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-700">
                            {bulkParsed.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="py-2 px-3 font-semibold text-gray-900">{item.nome}</td>
                                <td className="py-2 px-3 font-mono">{item.cpf}</td>
                                <td className="py-2 px-3 truncate max-w-[120px]" title={item.curso}>{item.curso}</td>
                                <td className="py-2 px-3">{item.polo}</td>
                                <td className="py-2 px-3">
                                  {item.modalidade === 'Online' ? (
                                    <span className="px-1.5 py-0.2 bg-orange-100 text-orange-700 border border-orange-200 rounded text-[9px] font-bold">Online</span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 border border-blue-200 rounded text-[9px] font-bold">Presencial</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 font-semibold text-xs rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              {activeTab === 'INDIVIDUAL' ? (
                <button
                  type="submit"
                  form="form-individual"
                  className="px-4 py-2 bg-[#03045e] hover:bg-blue-900 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-xs"
                >
                  Confirmar Cadastro
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={bulkParsed.length === 0 || !!bulkError}
                  className={`px-4 py-2 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer ${
                    bulkParsed.length === 0 || !!bulkError
                      ? 'bg-gray-300 pointer-events-none'
                      : 'bg-[#ff8000] hover:bg-orange-600'
                  }`}
                >
                  Importar {bulkParsed.length > 0 ? `(${bulkParsed.length})` : ''} Aluno(s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
