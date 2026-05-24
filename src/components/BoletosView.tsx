import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FileCheck2, 
  MessageSquare, 
  ExternalLink, 
  FileDown, 
  Calendar, 
  Copy, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { Boleto, Aluno } from '../types';

interface BoletosViewProps {
  boletos: Boleto[];
  alunos: Aluno[];
  onTriggerSingleBoletoWhatsApp: (b: Boleto) => void;
  onTriggerAllOverdueWhatsApp: () => void;
  onSimulatePayment: (id: string) => void;
}

export default function BoletosView({ 
  boletos, 
  alunos, 
  onTriggerSingleBoletoWhatsApp,
  onTriggerAllOverdueWhatsApp,
  onSimulatePayment
}: BoletosViewProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredBoletos = useMemo(() => {
    return boletos.filter(b => {
      const matchesSearch = 
        b.alunoNome.toLowerCase().includes(search.toLowerCase()) ||
        b.nossoNumero.includes(search) ||
        b.competencia.includes(search);
      
      const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [boletos, search, filterStatus]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: Boleto['status']) => {
    switch (status) {
      case 'PAGO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Pago
          </span>
        );
      case 'VENCIDO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 uppercase">
            <AlertOctagon className="h-3 w-3 text-red-600 animate-pulse" />
            Vencido
          </span>
        );
      case 'ABERTO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            Aberto
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 text-gray-700 border border-gray-200 uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Painel Unificado de Boletos</h1>
          <p className="text-xs text-gray-400">Gerencie competências de faturamento, realize cobrança ativa individual ou massiva via WhatsApp</p>
        </div>
        <button 
          onClick={onTriggerAllOverdueWhatsApp}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md cursor-pointer transition"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Cobrar Todos os Vencidos (WhatsApp)</span>
        </button>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Pago</p>
            <p className="text-lg font-extrabold text-emerald-600 font-mono mt-1">
              R$ {boletos.filter(b=>b.status==='PAGO').reduce((a,c)=>a+c.valor, 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">
            {boletos.filter(b=>b.status==='PAGO').length} Títulos
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Vencido em Cobrança</p>
            <p className="text-lg font-extrabold text-red-650 font-mono text-red-600 mt-1">
              R$ {boletos.filter(b=>b.status==='VENCIDO').reduce((a,c)=>a+c.valor, 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-red-50 text-red-600">
            {boletos.filter(b=>b.status==='VENCIDO').length} Títulos
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total em Aberto (A Vencer)</p>
            <p className="text-lg font-extrabold text-amber-750 font-mono text-amber-600 mt-1">
              R$ {boletos.filter(b=>b.status==='ABERTO').reduce((a,c)=>a+c.valor, 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-600">
            {boletos.filter(b=>b.status==='ABERTO').length} Títulos
          </span>
        </div>
      </div>

      {/* Filter and search parameters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por estudante, nosso número ou competência..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#03045e] focus:bg-white transition"
          />
        </div>

        <div className="flex gap-2">
          {/* Status selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs text-gray-700">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-semibold"
            >
              <option value="ALL">Qualquer faturamento</option>
              <option value="PAGO">Pago</option>
              <option value="ABERTO">Aberto / A Vencer</option>
              <option value="VENCIDO">Vencido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Datatable list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#03045e]/5 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="py-4 px-6">Estudante Relacionado</th>
                <th className="py-4 px-4">Competência / Vencimento</th>
                <th className="py-4 px-4">Preço do Título</th>
                <th className="py-4 px-4">Nosso Número</th>
                <th className="py-4 px-4">Identificador de Status</th>
                <th className="py-4 px-4">Acionamentos</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredBoletos.length > 0 ? (
                filteredBoletos.map((boleto) => (
                  <tr key={boleto.id} className="hover:bg-slate-50/40 transition">
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-bold text-gray-900 block">{boleto.alunoNome}</span>
                        <span className="text-[10px] text-gray-400">ID Título: {boleto.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-700">Ref: {boleto.competencia}</p>
                      <p className="text-[10px] text-[#ff8000] font-bold mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vence: {boleto.vencimento}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-bold font-mono text-gray-800">
                      R$ {boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-gray-600 bg-gray-50 border border-gray-100 px-1.5 py-1 rounded text-[10px] font-semibold">
                        {boleto.nossoNumero}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(boleto.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[10px]">
                        <p className="font-bold text-gray-800">{boleto.enviadoWhatsAppCount} disparos</p>
                        {boleto.ultimoEnvio ? (
                          <p className="text-gray-400 mt-0.5 font-mono">Último: {boleto.ultimoEnvio}</p>
                        ) : (
                          <p className="text-gray-300 mt-0.5">Sem envio ativo</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center gap-2">
                        {/* Copy digital code */}
                        <button 
                          onClick={() => copyToClipboard(boleto.linhaDigitavel, boleto.id)}
                          className="bg-gray-50 hover:bg-gray-100 p-2 border border-gray-200 text-gray-600 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1"
                          title="Copiar Código de Barras"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="text-[9px] font-semibold font-sans">{copiedId === boleto.id ? 'Copiado!' : 'Cód'}</span>
                        </button>

                        {/* Simulate Pay Trigger */}
                        {boleto.status !== 'PAGO' && (
                          <button
                            onClick={() => onSimulatePayment(boleto.id)}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 font-bold px-2 py-1.5 rounded-lg border border-emerald-200 text-[10px] transition cursor-pointer shrink-0"
                          >
                            Simular Pago
                          </button>
                        )}

                        {/* Direct WhatsApp notify */}
                        <button 
                          onClick={() => onTriggerSingleBoletoWhatsApp(boleto)}
                          disabled={boleto.status === 'PAGO'}
                          className={`p-2 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                            boleto.status === 'PAGO'
                              ? 'text-gray-300 bg-gray-50 border-gray-100 pointer-events-none'
                              : 'text-orange-500 bg-orange-50/40 hover:bg-orange-50 border-[#ff8000]/20'
                          }`}
                          title="Cobrar este Boleto (WhatsApp)"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="text-[9px] font-bold font-sans">Cobrar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <p className="text-sm font-semibold">Nenhum boleto encontrado no banco</p>
                    <p className="text-xs">Ajuste os filtros ou use a pesquisa de faturamento.</p>
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
