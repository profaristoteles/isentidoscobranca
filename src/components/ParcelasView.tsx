import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  MessageSquare,
  Calendar,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Play,
  MoreVertical,
  Handshake,
  CalendarClock,
  Pencil,
  Ban,
  ShieldOff,
  UserCog
} from 'lucide-react';
import { Parcela, Aluno, StatusParcela } from '../types';
import { formatParcela } from '../utils/parcelas';

interface ParcelasViewProps {
  parcelas: Parcela[];
  alunos: Aluno[];
  onMarkPaid: (id: string) => void;
  onRegisterNegotiation: (id: string, observacao?: string) => void;
  onEditDueDate: (id: string, novoVencimento: string) => void;
  onEditValor: (id: string, novoValor: number) => void;
  onCancel: (id: string) => void;
  onExempt: (id: string) => void;
  onResendCharge: (parcela: Parcela) => void;
  onTriggerAllOverdue: () => void;
  onSendToHuman: (parcela: Parcela) => void;
}

const STATUS_LABEL: Record<StatusParcela, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
  NEGOCIADO: 'Negociado',
  CANCELADO: 'Cancelado',
  ISENTO: 'Isento'
};

export default function ParcelasView({
  parcelas,
  alunos,
  onMarkPaid,
  onRegisterNegotiation,
  onEditDueDate,
  onEditValor,
  onCancel,
  onExempt,
  onResendCharge,
  onTriggerAllOverdue,
  onSendToHuman
}: ParcelasViewProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterTurma, setFilterTurma] = useState<string>('ALL');
  const [filterCurso, setFilterCurso] = useState<string>('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const turmas = useMemo(() => Array.from(new Set(parcelas.map(p => p.turma).filter(Boolean))).sort(), [parcelas]);
  const cursos = useMemo(() => Array.from(new Set(parcelas.map(p => p.curso).filter(Boolean))).sort(), [parcelas]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return parcelas
      .filter(p => {
        const matchesSearch = !q ||
          p.alunoNome.toLowerCase().includes(q) ||
          p.competencia.includes(q) ||
          formatParcela(p).includes(q);
        const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
        const matchesTurma = filterTurma === 'ALL' || p.turma === filterTurma;
        const matchesCurso = filterCurso === 'ALL' || p.curso === filterCurso;
        return matchesSearch && matchesStatus && matchesTurma && matchesCurso;
      })
      .sort((a, b) => {
        const dateComp = a.vencimento.localeCompare(b.vencimento);
        if (dateComp !== 0) return dateComp;
        const nameComp = a.alunoNome.localeCompare(b.alunoNome);
        if (nameComp !== 0) return nameComp;
        return a.numeroParcela - b.numeroParcela;
      });
  }, [parcelas, debouncedSearch, filterStatus, filterTurma, filterCurso]);

  const totalRecebido = parcelas.filter(p => p.status === 'PAGO').reduce((a, c) => a + c.valorAtual, 0);
  const totalAVencer = parcelas.filter(p => p.status === 'PENDENTE').reduce((a, c) => a + c.valorAtual, 0);
  const totalAtrasado = parcelas.filter(p => p.status === 'ATRASADO').reduce((a, c) => a + c.valorAtual, 0);

  const getStatusBadge = (status: StatusParcela) => {
    const styles: Record<StatusParcela, string> = {
      PAGO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ATRASADO: 'bg-red-50 text-red-700 border-red-200',
      PENDENTE: 'bg-amber-50 text-amber-700 border-amber-200',
      NEGOCIADO: 'bg-blue-50 text-blue-700 border-blue-200',
      CANCELADO: 'bg-gray-100 text-gray-600 border-gray-200',
      ISENTO: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    const icon: Record<StatusParcela, React.ReactNode> = {
      PAGO: <CheckCircle2 className="h-3 w-3" />,
      ATRASADO: <AlertOctagon className="h-3 w-3 animate-pulse" />,
      PENDENTE: <AlertTriangle className="h-3 w-3" />,
      NEGOCIADO: <Handshake className="h-3 w-3" />,
      CANCELADO: <Ban className="h-3 w-3" />,
      ISENTO: <ShieldOff className="h-3 w-3" />
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${styles[status]}`}>
        {icon[status]}
        {STATUS_LABEL[status]}
      </span>
    );
  };

  const emAberto = (p: Parcela) => p.status === 'PENDENTE' || p.status === 'ATRASADO';

  const handleEditVenc = (p: Parcela) => {
    const novo = window.prompt(`Novo vencimento para a parcela ${formatParcela(p)} (DD/MM/AAAA):`, p.vencimento);
    if (novo && novo.trim()) onEditDueDate(p.id, novo.trim());
    setOpenMenuId(null);
  };

  const handleEditValorPrompt = (p: Parcela) => {
    const novo = window.prompt(`Novo valor atual da parcela ${formatParcela(p)} (valor original R$ ${p.valorOriginal.toFixed(2)}):`, String(p.valorAtual));
    const num = novo ? parseFloat(novo.replace(',', '.')) : NaN;
    if (!isNaN(num) && num >= 0) onEditValor(p.id, num);
    setOpenMenuId(null);
  };

  const handleNegociar = (p: Parcela) => {
    const obs = window.prompt(`Observação da negociação da parcela ${formatParcela(p)} (opcional):`, '') || undefined;
    onRegisterNegotiation(p.id, obs);
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Financeiro · Gestão de Parcelas</h1>
          <p className="text-xs text-gray-400">Acompanhe mensalidades por matrícula financeira, registre pagamentos e negocie com cobrança ativa via WhatsApp</p>
        </div>
        <button
          onClick={onTriggerAllOverdue}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md cursor-pointer transition"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Cobrar Todas as Atrasadas (WhatsApp)</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Recebido</p>
            <p className="text-lg font-extrabold text-emerald-600 font-mono mt-1">
              R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">
            {parcelas.filter(p => p.status === 'PAGO').length} parcelas
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Atrasado (em cobrança)</p>
            <p className="text-lg font-extrabold text-red-600 font-mono mt-1">
              R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-red-50 text-red-600">
            {parcelas.filter(p => p.status === 'ATRASADO').length} parcelas
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">A Vencer</p>
            <p className="text-lg font-extrabold text-amber-600 font-mono mt-1">
              R$ {totalAVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-600">
            {parcelas.filter(p => p.status === 'PENDENTE').length} parcelas
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por aluno, competência ou nº da parcela..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#03045e] focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs text-gray-700">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-semibold">
              <option value="ALL">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ATRASADO">Atrasado</option>
              <option value="PAGO">Pago</option>
              <option value="NEGOCIADO">Negociado</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="ISENTO">Isento</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs text-gray-700">
            <select value={filterTurma} onChange={(e) => setFilterTurma(e.target.value)} className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-semibold">
              <option value="ALL">Todas as turmas</option>
              {turmas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs text-gray-700 max-w-[200px]">
            <select value={filterCurso} onChange={(e) => setFilterCurso(e.target.value)} className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-semibold truncate">
              <option value="ALL">Todos os cursos</option>
              {cursos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#03045e]/5 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="py-4 px-6">Aluno / Turma</th>
                <th className="py-4 px-4">Parcela</th>
                <th className="py-4 px-4">Competência / Vencimento</th>
                <th className="py-4 px-4">Valor</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Disparos</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/40 transition">
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-900 block">{p.alunoNome}</span>
                      <span className="text-[10px] text-gray-400">{p.turma || '—'} · {p.curso}</span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-gray-800">{formatParcela(p)}</td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-700">Ref: {p.competencia}</p>
                      <p className="text-[10px] text-[#ff8000] font-bold mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vence: {p.vencimento}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-mono text-gray-800">
                      <span className="font-bold">R$ {p.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      {p.valorAtual !== p.valorOriginal && (
                        <p className="text-[10px] text-gray-400 line-through mt-0.5">R$ {p.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      )}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-gray-800">{p.enviadoWhatsAppCount} disparos</p>
                      {p.ultimoEnvio ? (
                        <p className="text-gray-400 mt-0.5 font-mono text-[10px]">Último: {p.ultimoEnvio}</p>
                      ) : (
                        <p className="text-gray-300 mt-0.5 text-[10px]">Sem envio</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center gap-2">
                        {emAberto(p) && (
                          <button
                            onClick={() => onMarkPaid(p.id)}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 font-bold px-2 py-1.5 rounded-lg border border-emerald-200 text-[10px] transition cursor-pointer shrink-0"
                          >
                            ✓ Pago
                          </button>
                        )}
                        {emAberto(p) && (
                          <button
                            onClick={() => onResendCharge(p)}
                            className="p-2 rounded-lg border transition cursor-pointer flex items-center gap-1 text-orange-500 bg-orange-50/40 hover:bg-orange-50 border-[#ff8000]/20"
                            title="Cobrar esta parcela (WhatsApp)"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-bold font-sans">Cobrar</span>
                          </button>
                        )}

                        {/* Action menu */}
                        <div className="relative" ref={openMenuId === p.id ? menuRef : undefined}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition cursor-pointer"
                            title="Mais ações"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                          {openMenuId === p.id && (
                            <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-20 py-1 text-left">
                              <button onClick={() => handleNegociar(p)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 cursor-pointer">
                                <Handshake className="h-3.5 w-3.5 text-blue-600" /> Registrar negociação
                              </button>
                              <button onClick={() => handleEditVenc(p)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                                <CalendarClock className="h-3.5 w-3.5 text-gray-500" /> Editar vencimento
                              </button>
                              <button onClick={() => handleEditValorPrompt(p)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                                <Pencil className="h-3.5 w-3.5 text-gray-500" /> Editar valor
                              </button>
                              <button onClick={() => { onSendToHuman(p); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                                <UserCog className="h-3.5 w-3.5 text-[#03045e]" /> Atendimento humano
                              </button>
                              <div className="border-t border-gray-100 my-1" />
                              <button onClick={() => { onExempt(p.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-700 hover:bg-purple-50 cursor-pointer">
                                <ShieldOff className="h-3.5 w-3.5" /> Isentar parcela
                              </button>
                              <button onClick={() => { onCancel(p.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer">
                                <Ban className="h-3.5 w-3.5" /> Cancelar parcela
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <p className="text-sm font-semibold">Nenhuma parcela encontrada</p>
                    <p className="text-xs">Ajuste os filtros ou cadastre uma matrícula financeira.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
