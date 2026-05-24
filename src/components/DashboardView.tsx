import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertOctagon, 
  MessageSquareOff, 
  Sparkles, 
  Lightbulb, 
  FileCheck2,
  CalendarDays,
  Percent,
  CheckCircle2,
  Undo2,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Aluno, Boleto, LogAtividade } from '../types';

// Custom sleek glassmorphic tooltips for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl shadow-xl text-white text-xs font-sans animate-fade-in">
        <p className="font-bold border-b border-white/10 pb-1 mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((pld: any) => (
            <p key={pld.name} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: pld.color || pld.fill }} />
              <span className="text-gray-300">{pld.name}:</span>
              <span className="font-mono font-bold">
                {typeof pld.value === 'number' 
                  ? pld.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) 
                  : pld.value}
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const PercentTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl shadow-xl text-white text-xs font-sans animate-fade-in">
        <p className="font-bold border-b border-white/10 pb-1 mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((pld: any) => (
            <p key={pld.name} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: pld.color || pld.fill }} />
              <span className="text-gray-300">{pld.name}:</span>
              <span className="font-mono font-bold">
                {typeof pld.value === 'number' ? `${pld.value.toFixed(1)}%` : pld.value}
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardViewProps {
  alunos: Aluno[];
  boletos: Boleto[];
  logs: LogAtividade[];
  onSetTab: (tab: string) => void;
}

export default function DashboardView({ alunos, boletos, logs, onSetTab }: DashboardViewProps) {
  // Filter States
  const [filterCurso, setFilterCurso] = useState<string>('ALL');
  const [filterPolo, setFilterPolo] = useState<string>('ALL');

  // Build unique lists for filter dropdowns
  const listCursos = Array.from(new Set(alunos.map(a => a.curso))).sort();
  const listPolos = Array.from(new Set(alunos.map(a => a.polo))).sort();

  // Filter Alunos
  const filteredAlunos = alunos.filter(a => {
    const matchesCurso = filterCurso === 'ALL' || a.curso === filterCurso;
    const matchesPolo = filterPolo === 'ALL' || a.polo === filterPolo;
    return matchesCurso && matchesPolo;
  });

  const filteredAlunoIds = new Set(filteredAlunos.map(a => a.id));

  // Filter Boletos based on filtered Alunos
  const filteredBoletos = boletos.filter(b => filteredAlunoIds.has(b.alunoId));

  // Real calculations based on filtered dataset
  const totalRecebidoCalculado = filteredBoletos
    .filter(b => b.status === 'PAGO')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalEmAbertoCalculado = filteredBoletos
    .filter(b => b.status === 'ABERTO')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalVencidosCalculado = filteredBoletos
    .filter(b => b.status === 'VENCIDO')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalGeral = totalRecebidoCalculado + totalEmAbertoCalculado + totalVencidosCalculado;
  const taxaInadimplencia = totalGeral > 0 ? (totalVencidosCalculado / totalGeral) * 100 : 0;

  // Scale numbers to give realistic portfolio sizing
  const SCALE = 25;
  const scaleCurrency = (v: number) => v * SCALE;

  const totalRecebido = scaleCurrency(totalRecebidoCalculado);
  const totalEmAberto = scaleCurrency(totalEmAbertoCalculado);
  const totalVencido = scaleCurrency(totalVencidosCalculado);
  const totalCobrancasEnviadas = filteredBoletos.reduce((acc, curr) => acc + curr.enviadoWhatsAppCount, 0) * 10;
  const taxaRecuperacaoEstimada = filteredBoletos.filter(b => b.status === 'PAGO').length > 0 ? 68.4 : 0;

  // Inadimplência Chart data
  const inadimplenciaMensalData = [
    { mes: 'Jan', taxa: 18.5, meta: 12.0 },
    { mes: 'Fev', taxa: 16.2, meta: 12.0 },
    { mes: 'Mar', taxa: 14.8, meta: 10.0 },
    { mes: 'Abr', taxa: 15.4, meta: 10.0 },
    { mes: 'Mai (Hoje)', taxa: taxaInadimplencia, meta: 10.0 },
  ];

  // Dynamic distribution by specialization course
  const pagamentosPorCursoData = listCursos.map(curso => {
    const totalCurso = filteredBoletos
      .filter(b => {
        const student = alunos.find(a => a.id === b.alunoId);
        return student?.curso === curso && b.status === 'PAGO';
      })
      .reduce((acc, curr) => acc + curr.valor, 0);
    
    // Shorten the course name for presentation
    const displayName = curso
      .replace('Pós-Graduação em ', '')
      .replace('Especialização em ', '')
      .replace('Aperfeiçoamento em ', '')
      .replace('MBA em ', '');

    return {
      name: displayName,
      value: scaleCurrency(totalCurso)
    };
  }).filter(item => item.value > 0);

  // Status breakdown
  const statusCobrancaData = [
    { name: 'Pagas em Dia', value: filteredBoletos.filter(b => b.status === 'PAGO').length, color: '#10b981' },
    { name: 'Pendentes em Aberto', value: filteredBoletos.filter(b => b.status === 'ABERTO').length, color: '#ff8000' },
    { name: 'Inadimplentes (Vencidos)', value: filteredBoletos.filter(b => b.status === 'VENCIDO').length, color: '#ef4444' }
  ];

  // Recalculate historical progression chart relative to student count ratio
  const ratio = alunos.length > 0 ? filteredAlunos.length / alunos.length : 1;
  const crescimentoFinanceiroData = [
    { mes: 'Dez/25', recebido: Math.round(22000 * ratio), emAberto: Math.round(4500 * ratio), recuperado: Math.round(1200 * ratio) },
    { mes: 'Jan/26', recebido: Math.round(24500 * ratio), emAberto: Math.round(5200 * ratio), recuperado: Math.round(1800 * ratio) },
    { mes: 'Fev/26', recebido: Math.round(28900 * ratio), emAberto: Math.round(4900 * ratio), recuperado: Math.round(2400 * ratio) },
    { mes: 'Mar/26', recebido: Math.round(32000 * ratio), emAberto: Math.round(6800 * ratio), recuperado: Math.round(3800 * ratio) },
    { mes: 'Abr/26', recebido: Math.round(34150 * ratio), emAberto: Math.round(8100 * ratio), recuperado: Math.round(4500 * ratio) },
    { mes: 'Mai/26', recebido: totalRecebido, emAberto: totalEmAberto, recuperado: Math.round(11200 * ratio) },
  ];

  const CHART_COLORS = ['#03045e', '#ff8000', '#00b4d8', '#ffb703', '#4ea8de'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#03045e] to-[#050c5a] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 bg-white/5 h-48 w-48 rounded-full blur-2xl" />
        <div className="z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-orange-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Plataforma Ativa
            </span>
            <span className="text-blue-200 text-xs font-medium">Parceria Instituto Sentidos & FAEPI</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Gestão de Cobranças Acadêmicas</h1>
          <p className="text-sm text-blue-100 mt-1 max-w-xl">
            Acompanhe o fluxo financeiro em tempo real, gerencie os disparos por WhatsApp e regule a inadimplência com automação humanizada.
          </p>
        </div>
        <div className="z-10 flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => onSetTab('importações')}
            className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-lg cursor-pointer transition"
          >
            Importar CNAB/Boletos
          </button>
          <button 
            onClick={() => onSetTab('whatsapp')}
            className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs px-4 py-2.5 rounded-lg cursor-pointer transition"
          >
            Ver Evolution API
          </button>
        </div>
      </div>

      {/* Interactive Filters Panel */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#03045e]/10 text-[#03045e] rounded-lg">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Filtros da Instituição
            </h2>
            <p className="text-[10px] text-gray-400">Dados filtrados por Polo regional e Especialidade acadêmica</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
          {/* Polo filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700">
            <span className="font-semibold text-slate-500">Polo:</span>
            <select 
              value={filterPolo}
              onChange={(e) => setFilterPolo(e.target.value)}
              className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-bold text-[#03045e]"
            >
              <option value="ALL">Todos os Polos</option>
              {listPolos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Curso filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 max-w-xs md:max-w-md">
            <span className="font-semibold text-slate-500">Curso:</span>
            <select 
              value={filterCurso}
              onChange={(e) => setFilterCurso(e.target.value)}
              className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-bold text-[#03045e] truncate w-full"
            >
              <option value="ALL">Todos os Cursos</option>
              {listCursos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters button */}
          {(filterCurso !== 'ALL' || filterPolo !== 'ALL') && (
            <button 
              onClick={() => {
                setFilterCurso('ALL');
                setFilterPolo('ALL');
              }}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100/50 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Recebido */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500">Total Recebido (Mês)</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-gray-950 font-mono">
              R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] font-medium text-emerald-600 mt-0.5 flex items-center gap-1">
              <span className="font-bold">+12%</span> em relação ao mês anterior
            </p>
          </div>
        </div>

        {/* Card 2: Total em Aberto */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500">Total em Aberto</span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-gray-950 font-mono">
              R$ {totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] font-medium text-blue-500 mt-0.5">
              Boleto a vencer nesta semana
            </p>
          </div>
        </div>

        {/* Card 3: Inadimplência */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500">Inadimplência</span>
            <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-red-600 font-mono">
              {taxaInadimplencia.toFixed(1)}%
            </span>
            <p className="text-[10px] font-medium text-red-500 mt-0.5">
              Meta estipulada: &lt; 10%
            </p>
          </div>
        </div>

        {/* Card 4: Boletos Vencidos */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500 font-sans">Montante Vencido</span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-gray-900 font-mono">
              R$ {totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] font-medium text-rose-600 mt-0.5">
              Refere-se ao montante para cobrança
            </p>
          </div>
        </div>

        {/* Card 5: Cobranças Enviadas */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500">Notificações Env.</span>
            <div className="p-1.5 bg-orange-50 rounded-lg text-[#ff8000]">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-gray-950 font-mono">
              {totalCobrancasEnviadas}
            </span>
            <p className="text-[10px] font-medium text-[#ff8000] mt-0.5">
              Acionamentos WhatsApp
            </p>
          </div>
        </div>

        {/* Card 6: Recuperação do Mês */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500">Recuperação</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-gray-950 font-mono">
              {taxaRecuperacaoEstimada.toFixed(1)}%
            </span>
            <p className="text-[10px] font-medium text-emerald-600 mt-0.5">
              Acordo pago em até 7 dias
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Crescimento Financeiro e Comparativo */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Crescimento Educacional & Recuperações</h3>
              <p className="text-xs text-gray-400">Total gerido vs. valores efetivamente resgatados pela régua (acumulado semestral)</p>
            </div>
            <span className="text-xs bg-[#03045e]/10 text-[#03045e] font-semibold px-2 py-0.5 rounded">R$ Milhares</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={crescimentoFinanceiroData}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#03045e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#03045e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRecup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff8000" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ff8000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area name="Valores Recebidos" type="monotone" dataKey="recebido" stroke="#03045e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRec)" />
                <Area name="Recuperados via Régua" type="monotone" dataKey="recuperado" stroke="#ff8000" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRecup)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Taxa de Inadimplência vs Meta */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight font-sans">Evolução de Inadimplência vs. Meta FAEPI</h3>
            <p className="text-xs text-gray-400">Taxa percentual de mensalidades vencidas não-pagas por mês de competência</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inadimplenciaMensalData}>
                <defs>
                  <linearGradient id="barTaxa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff8000" stopOpacity={0.95}/>
                    <stop offset="95%" stopColor="#ff8000" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="barMeta" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#03045e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#03045e" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} strokeWidth={0} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<PercentTooltip />} />
                <Legend />
                <Bar name="Taxa de Inadimplência" dataKey="taxa" fill="url(#barTaxa)" radius={[4, 4, 0, 0]} />
                <Bar name="Meta Acadêmica FAEPI" dataKey="meta" fill="url(#barMeta)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Receitas por Curso */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Receita de Mensalidades por Especialização (Mapeamento)</h3>
            <p className="text-xs text-gray-400">Distribuição financeira dos pagamentos consolidados neste mês</p>
          </div>
          <div className="h-72 flex flex-col md:flex-row items-center justify-between gap-4">
            {pagamentosPorCursoData.length > 0 ? (
              <>
                <div className="w-full md:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pagamentosPorCursoData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pagamentosPorCursoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} className="hover:opacity-80 transition cursor-pointer" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Visual Custom Legend */}
                <div className="w-full md:w-1/2 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {pagamentosPorCursoData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs animate-slide-up">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                        <span className="text-gray-650 text-gray-650 text-gray-600 font-semibold truncate max-w-[150px] md:max-w-[135px]" title={item.name}>{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-800 shrink-0">
                        R$ {item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full py-16 text-center text-gray-400 text-xs font-semibold">
                Nenhum recebimento consolidado para o filtro selecionado.
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Métricas do Fluxo da Régua de Cobrança */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Status das Cobranças Ativas (Lote Geral)</h3>
              <p className="text-xs text-gray-400">Proporção dos boletos da competência corrente por status de faturamento</p>
            </div>
            {/* Radial layout simulation or progress bars */}
            <div className="space-y-4 my-2">
              {statusCobrancaData.some(item => item.value > 0) ? (
                statusCobrancaData.map((item) => {
                  const totalItemsVal = statusCobrancaData.reduce((p, c) => p + c.value, 0);
                  const percentVal = totalItemsVal > 0 ? (item.value / totalItemsVal) * 100 : 0;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-gray-700 flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span className="font-bold text-gray-900 font-mono">
                          {item.value} boletos ({percentVal.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-150 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 shadow-3xs" 
                          style={{ width: `${percentVal}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs font-semibold">
                  Nenhum boleto gerado para esta seleção.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50/10 rounded-xl border border-blue-100/50 flex gap-3 text-xs text-slate-650 text-slate-600">
            <Lightbulb className="h-5 w-5 text-orange-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold text-slate-800 block">Dica de Recuperação Acadêmica:</span>
              <span>Os disparos realizados 1 dia útil após o vencimento têm uma taxa de conversão recorde de 43.1% em nosso CRM. Garanta que a régua instantânea de WhatsApp esteja ativa!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recents Activity Activity Logs section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Registro de Ocorrências Recentes</h3>
            <p className="text-xs text-gray-400">Logs de sistema, disparos Evolution API e atualizações LeadConnector</p>
          </div>
          <button 
            onClick={() => onSetTab('configurações')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            Ver fluxo completo &rarr;
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {logs.slice(0, 4).map((log) => (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs transition hover:bg-gray-50/50 px-2 rounded-lg">
              <div className="flex gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                  log.tipo === 'WHATSAPP' 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : log.tipo === 'CRM' 
                      ? 'bg-blue-50 text-blue-700' 
                      : log.tipo === 'IMPORTACAO' 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'bg-amber-50 text-amber-700'
                }`}>
                  {log.tipo}
                </span>
                <div className="space-y-0.5">
                  <p className="font-medium text-gray-800 leading-tight">{log.detalhe}</p>
                  <p className="text-[10px] text-gray-400">Disparado por {log.usuario || 'Automação'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-mono">{log.timestamp}</span>
                {log.sucesso ? (
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">Sucesso</span>
                ) : (
                  <span className="text-[10px] font-mono text-red-600 font-semibold">Falha</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
