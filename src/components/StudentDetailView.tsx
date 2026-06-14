import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Handshake,
  Send,
  GraduationCap,
  History,
  ListChecks,
  MessageSquare
} from 'lucide-react';
import { Aluno, Parcela, ParcelaHistorico, WhatsAppMensagem, StatusParcela } from '../types';
import { formatParcela } from '../utils/parcelas';

interface StudentDetailViewProps {
  student: Aluno;
  parcelas: Parcela[];
  parcelaHistorico: ParcelaHistorico[];
  mensagens: WhatsAppMensagem[];
  onBack: () => void;
  onSendCustomWhatsApp: (alunoId: string, text: string) => void;
  onMarkPaid: (parcelaId: string) => void;
  onSimulateDeal: (alunoId: string, parcelas: number, valorTotal: number) => void;
  onToggleCobrancaAutomatica: (alunoId: string) => void;
}

const STATUS_STYLE: Record<StatusParcela, string> = {
  PAGO: 'bg-emerald-100 text-emerald-800',
  ATRASADO: 'bg-rose-100 text-rose-800',
  PENDENTE: 'bg-amber-100 text-amber-800',
  NEGOCIADO: 'bg-blue-100 text-blue-800',
  CANCELADO: 'bg-gray-100 text-gray-600',
  ISENTO: 'bg-purple-100 text-purple-800'
};

export default function StudentDetailView({
  student,
  parcelas,
  parcelaHistorico,
  mensagens,
  onBack,
  onSendCustomWhatsApp,
  onMarkPaid,
  onSimulateDeal,
  onToggleCobrancaAutomatica
}: StudentDetailViewProps) {
  const [customMsg, setCustomMsg] = useState('');
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [dealParcelas, setDealParcelas] = useState(2);
  const [dealSuccess, setDealSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'PARCELAS' | 'MENSAGENS' | 'HISTORICO'>('PARCELAS');

  const studentParcelas = parcelas.filter(p => p.alunoId === student.id)
    .sort((a, b) => a.numeroParcela - b.numeroParcela);
  const studentMensagens = mensagens.filter(m => m.alunoId === student.id);
  const studentHistorico = parcelaHistorico.filter(h => h.alunoId === student.id)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const emAberto = studentParcelas.filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO' || p.status === 'NEGOCIADO');
  const restantesContrato = Math.max(0, (student.totalParcelas ?? 0) - (student.parcelasPagas ?? 0));
  // Prefere o contrato financeiro; recorre aos registros reais se o contrato for 0.
  const restantes = restantesContrato > 0 ? restantesContrato : emAberto.length;

  const getStatusLabelAndStyle = (status: Aluno['statusFinanceiro']) => {
    switch (status) {
      case 'EM_DIA': return { label: 'Regular (Em Dia)', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'PENDENTE': return { label: 'Aviso Importante (Pendente)', style: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'INADIMPLENTE': return { label: 'Crítico (Inadimplente)', style: 'bg-rose-50 text-rose-700 border-rose-300' };
    }
  };
  const currentStatusDesc = getStatusLabelAndStyle(student.statusFinanceiro);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;
    onSendCustomWhatsApp(student.id, customMsg.trim());
    setCustomMsg('');
  };

  const handleOfferDeal = () => {
    if (student.valorPendente <= 0) return;
    onSimulateDeal(student.id, dealParcelas, student.valorPendente);
    setDealSuccess(true);
    setTimeout(() => { setDealSuccess(false); setIsNegotiating(false); }, 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-3xs">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-[#03045e] hover:opacity-85 transition cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Lista de Alunos</span>
        </button>
        <span className="text-xs text-gray-400">ID Acadêmico: <strong className="font-mono text-gray-700">{student.id}</strong></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs text-center relative overflow-hidden">
            <div className={`absolute left-0 top-0 right-0 h-2 ${student.statusFinanceiro === 'EM_DIA' ? 'bg-emerald-500' : student.statusFinanceiro === 'PENDENTE' ? 'bg-amber-500' : 'bg-rose-500'}`} />
            <img src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt={student.nome} className="h-20 w-20 rounded-full mx-auto border-2 border-white shadow-md object-cover mt-2" referrerPolicy="no-referrer" />
            <h2 className="text-base font-bold text-gray-900 mt-3">{student.nome}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{student.curso}</p>

            <div className="mt-3 flex flex-col items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${currentStatusDesc.style}`}>{currentStatusDesc.label}</span>
              <div className="mt-2 w-full flex items-center justify-between bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 text-xs text-slate-700">
                <div className="text-left font-sans">
                  <span className="font-bold text-[10px] text-slate-800 uppercase block tracking-wider">Régua de Cobrança</span>
                  <span className="text-[9px] text-slate-400 font-medium">{student.cobrancaAutomatica !== false ? 'Envio automático ativo' : 'Disparos apenas manuais'}</span>
                </div>
                <button onClick={() => onToggleCobrancaAutomatica(student.id)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${student.cobrancaAutomatica !== false ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${student.cobrancaAutomatica !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-5 pt-5 border-t border-gray-50">
              <div className="text-center">
                <span className="text-[10px] text-gray-400 font-medium uppercase block">Pendente Total</span>
                <span className={`text-md font-extrabold font-mono ${student.valorPendente > 0 ? 'text-red-600' : 'text-gray-900'}`}>R$ {student.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="text-center border-l border-gray-50">
                <span className="text-[10px] text-gray-400 font-medium uppercase block">Parcelas em Aberto</span>
                <span className="text-md font-extrabold font-mono text-gray-900">{restantes}</span>
              </div>
            </div>
          </div>

          {/* Matrícula financeira summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-[#ff8000]" /> Matrícula Financeira
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Field label="Turma" value={student.turma || '—'} />
              <Field label="Mensalidade" value={student.valorMensalidade ? `R$ ${student.valorMensalidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'} />
              <Field label="Total de Parcelas" value={student.totalParcelas != null ? String(student.totalParcelas) : '—'} />
              <Field label="Parcelas Pagas" value={student.parcelasPagas != null ? String(student.parcelasPagas) : '—'} />
              <Field label="Dia de Vencimento" value={student.diaVencimento != null ? String(student.diaVencimento) : '—'} />
              <Field label="Data da Matrícula" value={student.dataMatriculaFinanceira || '—'} />
            </div>
          </div>

          {/* Personal info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2">Informações Pessoais</h3>
            <div className="space-y-3.5 text-xs">
              <Field label="CPF do Aluno" value={student.cpf} mono />
              <Field label="Matrícula FAEPI" value={student.matricula} mono />
              <div>
                <span className="text-gray-400 block font-medium">WhatsApp Celular</span>
                <span className="font-mono text-[#03045e] font-bold">{student.whatsapp}</span>
              </div>
              <Field label="E-mail Cadastrado" value={student.email} />
              <div>
                <span className="text-gray-400 block font-medium">Polo Acadêmico</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-gray-900 font-semibold">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" /><span>{student.polo}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1.5 border-t border-gray-50">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Ingresso: {student.cadastroData}</span>
              </div>
            </div>
          </div>

          {/* Deal card */}
          {student.statusFinanceiro !== 'EM_DIA' && (
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md space-y-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 bg-[#ff8000]/10 h-24 w-24 rounded-full" />
              <div className="flex justify-between items-start z-10 relative">
                <div>
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Ações de Resgate</h4>
                  <p className="text-sm font-semibold mt-1">Negociação Inteligente</p>
                </div>
                <Handshake className="h-5 w-5 text-orange-400" />
              </div>
              <p className="text-[11px] text-gray-300 z-10 relative">
                Ao confirmar o acordo, as parcelas em aberto viram NEGOCIADO e novas parcelas de acordo são geradas.
              </p>
              {!isNegotiating ? (
                <button onClick={() => setIsNegotiating(true)} className="w-full bg-[#ff8000] hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-xs transition cursor-pointer z-10 relative">Abrir Simulador de Acordo</button>
              ) : (
                <div className="space-y-3 pt-2 border-t border-white/10 z-10 relative">
                  <div>
                    <label className="text-[10px] text-gray-400 font-medium block mb-1">Número de Parcelas</label>
                    <select value={dealParcelas} onChange={(e) => setDealParcelas(Number(e.target.value))} className="w-full bg-slate-800 text-white border border-slate-700 p-1.5 rounded text-xs focus:ring-1 focus:ring-orange-500">
                      <option value={2}>2 Parcelas de R$ {(student.valorPendente / 2).toFixed(2)}</option>
                      <option value={3}>3 Parcelas de R$ {(student.valorPendente / 3).toFixed(2)}</option>
                      <option value={4}>4 Parcelas de R$ {(student.valorPendente / 4).toFixed(2)}</option>
                    </select>
                  </div>
                  {dealSuccess ? (
                    <div className="bg-emerald-500 text-white text-xs font-bold text-center py-2 rounded">✓ Acordo Registrado!</div>
                  ) : (
                    <div className="flex gap-1.5">
                      <button onClick={handleOfferDeal} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded text-xs transition cursor-pointer">Confirmar Acordo</button>
                      <button onClick={() => setIsNegotiating(false)} className="bg-slate-800 hover:bg-slate-700 text-gray-300 py-1.5 px-2 rounded text-xs transition cursor-pointer">Cancelar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column 2 & 3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <TabBtn active={activeTab === 'PARCELAS'} onClick={() => setActiveTab('PARCELAS')} icon={<ListChecks className="h-3.5 w-3.5" />} label={`Parcelas (${studentParcelas.length})`} />
              <TabBtn active={activeTab === 'MENSAGENS'} onClick={() => setActiveTab('MENSAGENS')} icon={<MessageSquare className="h-3.5 w-3.5" />} label="Mensagens" />
              <TabBtn active={activeTab === 'HISTORICO'} onClick={() => setActiveTab('HISTORICO')} icon={<History className="h-3.5 w-3.5" />} label="Histórico Financeiro" />
            </div>

            <div className="p-5">
              {activeTab === 'PARCELAS' && (
                <div className="space-y-3">
                  {studentParcelas.length > 0 ? studentParcelas.map((p) => (
                    <div key={p.id} className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition hover:shadow-xs w-full ${p.status === 'PAGO' ? 'bg-emerald-50/20 border-emerald-100' : p.status === 'ATRASADO' ? 'bg-rose-50/20 border-rose-100' : 'bg-white border-gray-100'}`}>
                      <div className="space-y-1 w-full md:w-auto flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-800">Parcela {formatParcela(p)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                          <span className="text-[10px] text-gray-400">Ref: {p.competencia}</span>
                        </div>
                        <p className="text-[10px] text-[#ff8000] font-bold flex items-center gap-1"><Calendar className="h-3 w-3" /> Vence: {p.vencimento}</p>
                        {p.observacoes && <p className="text-[10px] text-gray-500 italic">{p.observacoes}</p>}
                      </div>
                      <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 border-gray-50 pt-2 md:pt-0 gap-2">
                        <div className="text-right">
                          <p className="font-extrabold text-gray-900 font-mono text-sm">R$ {p.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          {p.valorAtual !== p.valorOriginal && <p className="text-[10px] text-gray-400 line-through">R$ {p.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
                        </div>
                        {(p.status === 'PENDENTE' || p.status === 'ATRASADO' || p.status === 'NEGOCIADO') && (
                          <button onClick={() => onMarkPaid(p.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2 py-1.5 rounded text-[10px] transition cursor-pointer">Marcar como Pago</button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="py-8 text-center text-gray-400 text-xs">Nenhuma parcela registrada para este aluno.</div>
                  )}
                </div>
              )}

              {activeTab === 'MENSAGENS' && (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {studentMensagens.length > 0 ? studentMensagens.map((msg, index) => (
                    <div key={msg.id} className="relative pl-6 pb-2">
                      {index < studentMensagens.length - 1 && <span className="absolute left-2.5 top-4 bottom-0 w-0.5 bg-gray-100" />}
                      <span className={`absolute left-0.5 top-1.5 h-4.5 w-4.5 rounded-full border-2 border-white flex items-center justify-center text-white ${msg.tipo === 'SISTEMA' ? 'bg-[#ff8000]' : 'bg-[#03045e]'}`}>
                        <span className="text-[8px] font-bold">●</span>
                      </span>
                      <div className="text-xs">
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span className="font-bold uppercase text-gray-600">{msg.tipo === 'SISTEMA' ? 'Disparo Automático' : 'Mensagem Manual'}</span>
                          <span className="font-mono">{new Date(msg.dataHora).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-gray-700 font-medium mt-1 leading-tight bg-gray-50 p-2 rounded-lg border border-gray-100">{msg.texto}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-6 text-center text-gray-400 text-xs">Nenhuma mensagem enviada ainda para este estudante.</div>
                  )}
                </div>
              )}

              {activeTab === 'HISTORICO' && (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {studentHistorico.length > 0 ? studentHistorico.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 text-xs border-b border-gray-50 pb-3 last:border-0">
                      <div className="shrink-0 mt-0.5 h-2 w-2 rounded-full bg-[#03045e]" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800">{h.acao}</span>
                          <span className="font-mono text-[10px] text-gray-400">{new Date(h.data).toLocaleString('pt-BR')}</span>
                        </div>
                        {h.observacao && <p className="text-[11px] text-gray-500 mt-0.5">{h.observacao}</p>}
                        {h.usuario && <p className="text-[9px] text-gray-400 mt-0.5">por {h.usuario}</p>}
                      </div>
                    </div>
                  )) : (
                    <div className="py-6 text-center text-gray-400 text-xs">Nenhuma movimentação financeira registrada ainda.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick chat */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex justify-between items-center">
                <span>Chat Direto WhatsApp</span>
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
              </h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-tight">Envie mensagens ad-hoc instantaneamente pela API de WhatsApp. Elas serão sincronizadas com o histórico.</p>
              <div className="mt-3.5 space-y-1">
                <span className="text-[9px] font-bold uppercase text-orange-400 block">Respostas Rápidas</span>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setCustomMsg(`Prezada ${student.nome.split(' ')[0]}, sua mensalidade vence nos próximos dias. Caso já tenha pago, desconsidere.`)} className="text-[9px] bg-blue-50 text-[#03045e] hover:bg-blue-100 p-1.5 rounded font-semibold transition cursor-pointer">Lembrete</button>
                  <button onClick={() => setCustomMsg(`Prezada ${student.nome.split(' ')[0]}, temos uma condição especial de negociação com desconto para as parcelas vencidas.`)} className="text-[9px] bg-blue-50 text-[#03045e] hover:bg-blue-100 p-1.5 rounded font-semibold transition cursor-pointer">Oferta de Negociação</button>
                </div>
              </div>
            </div>
            <form onSubmit={handleSendChat} className="mt-4 pt-3 border-t border-gray-50 flex gap-2">
              <input type="text" value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} placeholder="Escreva uma mensagem de cobrança..." className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#03045e] focus:bg-white focus:outline-hidden" />
              <button type="submit" className="bg-[#03045e] hover:bg-[#03045e]/90 text-white p-2 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center"><Send className="h-4 w-4" /></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-gray-400 block font-medium">{label}</span>
      <span className={`text-gray-900 font-semibold ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${active ? 'border-[#ff8000] text-[#03045e]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}>
      {icon}{label}
    </button>
  );
}
