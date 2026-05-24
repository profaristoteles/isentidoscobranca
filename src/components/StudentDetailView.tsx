import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XSquare, 
  MessageSquare, 
  PhoneCall, 
  FileCheck, 
  FileDown, 
  Handshake, 
  Send,
  Plus,
  Compass,
  CornerDownRight,
  Sparkles
} from 'lucide-react';
import { Aluno, Boleto, WhatsAppMensagem } from '../types';

interface StudentDetailViewProps {
  student: Aluno;
  boletos: Boleto[];
  mensagens: WhatsAppMensagem[];
  onBack: () => void;
  onSendCustomWhatsApp: (alunoId: string, text: string) => void;
  onSimulatePayment: (boletoId: string) => void;
  onSimulateDeal: (alunoId: string, parcelas: number, valorTotal: number) => void;
}

export default function StudentDetailView({ 
  student, 
  boletos, 
  mensagens, 
  onBack,
  onSendCustomWhatsApp,
  onSimulatePayment,
  onSimulateDeal
}: StudentDetailViewProps) {
  const [customMsg, setCustomMsg] = useState('');
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [dealParcelas, setDealParcelas] = useState(2);
  const [dealSuccess, setDealSuccess] = useState(false);

  // Filter bills & letters for this student
  const studentBoletos = boletos.filter(b => b.alunoId === student.id);
  const studentMensagens = mensagens.filter(m => m.alunoId === student.id);

  const getStatusLabelAndStyle = (status: Aluno['statusFinanceiro']) => {
    switch(status) {
      case 'EM_DIA':
        return { label: 'Regular (Em Dia)', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'PENDENTE':
        return { label: 'Aviso Importante (Pendente)', style: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'INADIMPLENTE':
        return { label: 'Crítico (Inadimplente)', style: 'bg-rose-50 text-rose-700 border-rose-300' };
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
    const totalPendente = student.valorPendente;
    if (totalPendente <= 0) return;
    onSimulateDeal(student.id, dealParcelas, totalPendente);
    setDealSuccess(true);
    setTimeout(() => {
      setDealSuccess(false);
      setIsNegotiating(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back to list and swift switch */}
      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-3xs">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-[#03045e] hover:opacity-85 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Lista de Alunos</span>
        </button>
        <span className="text-xs text-gray-400">ID Acadêmico: <strong className="font-mono text-gray-700">{student.id}</strong></span>
      </div>

      {/* Main Grid Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & Info Card (Column 1) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs text-center relative overflow-hidden">
            <div className={`absolute left-0 top-0 right-0 h-2 ${
              student.statusFinanceiro === 'EM_DIA' ? 'bg-emerald-500' : student.statusFinanceiro === 'PENDENTE' ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
            
            <img 
              src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
              alt={student.nome}
              className="h-20 w-20 rounded-full mx-auto border-2 border-white shadow-md object-cover mt-2"
              referrerPolicy="no-referrer"
            />
            
            <h2 className="text-base font-bold text-gray-900 mt-3">{student.nome}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{student.curso}</p>
            
            <div className="mt-3 flex justify-center">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${currentStatusDesc.style}`}>
                {currentStatusDesc.label}
              </span>
            </div>

            {/* Quick stats on student profile */}
            <div className="grid grid-cols-2 gap-2 mt-5 pt-5 border-t border-gray-50">
              <div className="text-center">
                <span className="text-[10px] text-gray-400 font-medium uppercase block">Pendente Total</span>
                <span className={`text-md font-extrabold font-mono ${student.valorPendente > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  R$ {student.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-center border-l border-gray-50">
                <span className="text-[10px] text-gray-400 font-medium uppercase block">Boletos Emitidos</span>
                <span className="text-md font-extrabold font-mono text-gray-900">
                  {studentBoletos.length}
                </span>
              </div>
            </div>
          </div>

          {/* Details Metadata */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2">Informações Pessoais</h3>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">CPF do Aluno</span>
                <span className="font-mono text-gray-900 font-semibold">{student.cpf}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Matrícula FAEPI</span>
                <span className="font-mono text-gray-900 font-semibold">{student.matricula}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">WhatsApp Celular</span>
                <span className="font-mono text-[#03045e] font-bold">{student.whatsapp}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">E-mail Cadastrado</span>
                <span className="text-gray-900">{student.email}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium font-sans">Polo Acadêmico</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-gray-900 font-semibold">
                  <MapPin className="h-3.5 w-3.5 text-gray-550 text-gray-400" />
                  <span>{student.polo}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block font-medium font-sans">Modalidade de Ensino</span>
                <div className="mt-1">
                  {student.modalidade === 'Online' ? (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-md text-[10px] font-bold">Online</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">Presencial</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1.5 border-t border-gray-50">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Ingresso: {student.cadastroData}</span>
              </div>
            </div>
          </div>

          {/* Offer Deal Card */}
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
                Crie um acordo em parcelas fixas para o encerramento do débito e aplique desconto em juros FAEPI.
              </p>
              
              {!isNegotiating ? (
                <button
                  onClick={() => setIsNegotiating(true)}
                  className="w-full bg-[#ff8000] hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-xs transition cursor-pointer z-10 relative"
                >
                  Abrir Simulador de Acordo
                </button>
              ) : (
                <div className="space-y-3 pt-2 border-t border-white/10 z-10 relative">
                  <div>
                    <label className="text-[10px] text-gray-400 font-medium block mb-1">Número de Parcelas</label>
                    <select 
                      value={dealParcelas} 
                      onChange={(e) => setDealParcelas(Number(e.target.value))}
                      className="w-full bg-slate-800 text-white border border-slate-700 p-1.5 rounded text-xs focus:ring-1 focus:ring-orange-500"
                    >
                      <option value={2}>2 Parcelas de R$ {(student.valorPendente / 2).toFixed(2)}</option>
                      <option value={3}>3 Parcelas de R$ {(student.valorPendente / 3).toFixed(2)}</option>
                      <option value={4}>4 Parcelas de R$ {(student.valorPendente / 4).toFixed(2)}</option>
                    </select>
                  </div>
                  
                  {dealSuccess ? (
                    <div className="bg-emerald-500 text-white text-xs font-bold text-center py-2 rounded">
                      ✓ Acordo Registrado em CRM!
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleOfferDeal}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded text-xs transition cursor-pointer"
                      >
                        Confirmar Acordo
                      </button>
                      <button
                        onClick={() => setIsNegotiating(false)}
                        className="bg-slate-800 hover:bg-slate-700 text-gray-300 py-1.5 px-2 rounded text-xs transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Historic & Timelines (Column 2 & 3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* List of Student Invoices */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-3 mb-4 flex items-center justify-between">
              <span>Histórico de Títulos e Boletos</span>
              <span className="text-xs font-medium text-gray-400">Total: {studentBoletos.length} mensalidades</span>
            </h3>

            <div className="space-y-3">
              {studentBoletos.map((boleto) => (
                <div 
                  key={boleto.id} 
                  className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition hover:shadow-xs ${
                    boleto.status === 'PAGO' 
                      ? 'bg-emerald-50/20 border-emerald-100' 
                      : boleto.status === 'VENCIDO' 
                        ? 'bg-rose-50/10 border-rose-100' 
                        : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">Comp: {boleto.competencia}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        boleto.status === 'PAGO' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : boleto.status === 'VENCIDO' 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {boleto.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono">Nosso Nº: {boleto.nossoNumero}</p>
                    <p className="text-[10px] text-gray-500 font-mono select-all" title="Copiar Linha Digitável">
                      {boleto.linhaDigitavel}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 border-gray-50 pt-2 md:pt-0 gap-2">
                    <p className="font-extrabold text-gray-900 font-mono text-sm self-center md:self-end">
                      R$ {boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex gap-1.5">
                      {/* Simulate payment button */}
                      {boleto.status !== 'PAGO' && (
                        <button
                          onClick={() => onSimulatePayment(boleto.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2 py-1.5 rounded text-[10px] transition cursor-pointer"
                        >
                          Simular Pago
                        </button>
                      )}
                      <button
                        onClick={() => alert(`Visualizando PDF do Boleto ${boleto.nossoNumero}`)}
                        className="bg-gray-50 border border-gray-200 hover:bg-gray-100 p-1.5 text-gray-600 rounded"
                        title="Baixar PDF do Boleto"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline of billing message alerts & Interactive Chat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Timeline Column */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2">Timeline de Cobrança</h4>
              
              <div className="space-y-4 max-h-75 overflow-y-auto pr-1">
                {studentMensagens.length > 0 ? (
                  studentMensagens.map((msg, index) => (
                    <div key={msg.id} className="relative pl-6 pb-2">
                      {/* Timeline dot line */}
                      {index < studentMensagens.length - 1 && (
                        <span className="absolute left-2.5 top-4 bottom-0 w-0.5 bg-gray-100" />
                      )}
                      <span className={`absolute left-0.5 top-1.5 h-4.5 w-4.5 rounded-full border-2 border-white flex items-center justify-center text-white ${
                        msg.tipo === 'SISTEMA' ? 'bg-[#ff8000]' : 'bg-[#03045e]'
                      }`}>
                        <span className="text-[8px] font-bold">●</span>
                      </span>

                      <div className="text-xs">
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span className="font-bold uppercase text-gray-600">
                            {msg.tipo === 'SISTEMA' ? 'Disparo Automático' : 'Mensagem Manual'}
                          </span>
                          <span className="font-mono">{new Date(msg.dataHora).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-gray-700 font-medium mt-1 leading-tight bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {msg.texto}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    Nenhum disparo enviado ainda para este estudante.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Interactive Chat / WhatsApp messaging box */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex justify-between items-center">
                  <span>Chat Direto WhatsApp</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                </h4>
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                  Envie mensagens ad-hoc instantaneamente por meio da API de WhatsApp. Elas serão sincronizadas com o histórico.
                </p>

                {/* Pre-written snippets */}
                <div className="mt-3.5 space-y-1">
                  <span className="text-[9px] font-bold uppercase text-orange-400 block">Respostas Rápidas FAEPI/Sentidos</span>
                  <div className="flex flex-wrap gap-1">
                    <button 
                      onClick={() => setCustomMsg(`Prezada ${student.nome.split(' ')[0]}, seu boleto vence nos próximos dias. Caso já tenha realizado o pagamento por favor desconsidere.`)}
                      className="text-[9px] bg-blue-50 text-[#03045e] hover:bg-blue-100 p-1.5 rounded font-semibold transition cursor-pointer"
                    >
                      Boleto Avançado
                    </button>
                    <button 
                      onClick={() => setCustomMsg(`Prezada ${student.nome.split(' ')[0]}, estamos com uma campanha especial para quitação das parcelas vencidas com isenção total de juros convencionais para o Instituto Sentidos.`)}
                      className="text-[9px] bg-blue-50 text-[#03045e] hover:bg-blue-100 p-1.5 rounded font-semibold transition cursor-pointer"
                    >
                      Isenção Juros
                    </button>
                  </div>
                </div>
              </div>

              {/* Text area and trigger form */}
              <form onSubmit={handleSendChat} className="mt-4 pt-3 border-t border-gray-50 flex gap-2">
                <input 
                  type="text" 
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Escreva uma mensagem de cobrança..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#03045e] focus:bg-white focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="bg-[#03045e] hover:bg-[#03045e]/90 text-white p-2 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
