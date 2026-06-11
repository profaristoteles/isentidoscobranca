import React, { useState } from 'react';
import {
  DollarSign,
  Clock,
  AlertOctagon,
  Percent,
  Filter,
  TrendingUp,
  Users,
  Handshake,
  Lightbulb,
  CalendarClock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Aluno, Parcela, LogAtividade } from '../types';

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

interface DashboardViewProps {
  alunos: Aluno[];
  parcelas: Parcela[];
  logs: LogAtividade[];
  onSetTab: (tab: string) => void;
}

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DashboardView({ alunos, parcelas, logs, onSetTab }: DashboardViewProps) {
  const [filterCurso, setFilterCurso] = useState<string>('ALL');
  const [filterPolo, setFilterPolo] = useState<string>('ALL');

  const listCursos = Array.from(new Set(alunos.map(a => a.curso))).sort();
  const listPolos = Array.from(new Set(alunos.map(a => a.polo))).sort();

  const filteredAlunos = alunos.filter(a => {
    const matchesCurso = filterCurso === 'ALL' || a.curso === filterCurso;
    const matchesPolo = filterPolo === 'ALL' || a.polo === filterPolo;
    return matchesCurso && matchesPolo;
  });
  const filteredAlunoIds = new Set(filteredAlunos.map(a => a.id));
  const fp = parcelas.filter(p => filteredAlunoIds.has(p.alunoId));

  // Receita Prevista = Σ valorOriginal (exclui canceladas/isentas)
  const receitaPrevista = fp.filter(p => p.status !== 'CANCELADO' && p.status !== 'ISENTO').reduce((a, c) => a + c.valorOriginal, 0);
  // Receita Recebida = Σ valorAtual das pagas
  const receitaRecebida = fp.filter(p => p.status === 'PAGO').reduce((a, c) => a + c.valorAtual, 0);
  // Receita em Aberto = Σ valorAtual de pendentes/atrasadas/negociadas
  const receitaEmAberto = fp.filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO' || p.status === 'NEGOCIADO').reduce((a, c) => a + c.valorAtual, 0);
  // Receita Recuperada por Negociação = Σ valorAtual de parcelas de acordo já pagas
  const receitaRecuperada = fp.filter(p => p.origem === 'NEGOCIACAO' && p.status === 'PAGO').reduce((a, c) => a + c.valorAtual, 0);

  const parcelasVencidas = fp.filter(p => p.status === 'ATRASADO');
  const parcelasAVencer = fp.filter(p => p.status === 'PENDENTE');
  const totalVencidoValor = parcelasVencidas.reduce((a, c) => a + c.valorAtual, 0);

  const totalAlunos = filteredAlunos.length;
  const inadimplentes = filteredAlunos.filter(a => a.statusFinanceiro === 'INADIMPLENTE').length;
  const adimplentes = filteredAlunos.filter(a => a.statusFinanceiro === 'EM_DIA').length;

  const taxaRecuperacao = receitaPrevista > 0 ? (receitaRecebida / receitaPrevista) * 100 : 0;
  const taxaInadimplencia = receitaPrevista > 0 ? (totalVencidoValor / receitaPrevista) * 100 : 0;

  // Inadimplência (valor atrasado) por dimensão
  const groupOverdue = (key: 'turma' | 'curso' | 'polo') => {
    const map: Record<string, number> = {};
    parcelasVencidas.forEach(p => {
      const k = (p[key] as string) || '—';
      map[k] = (map[k] || 0) + p.valorAtual;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const inadByTurma = groupOverdue('turma');
  const inadByCurso = groupOverdue('curso').map(d => ({
    name: d.name.replace('Pós-Graduação em ', '').replace('Especialização em ', '').replace('Aperfeiçoamento em ', '').replace('MBA em ', ''),
    value: d.value
  }));
  const inadByPolo = groupOverdue('polo');

  // Receita recebida por curso (pie)
  const receitaPorCurso = listCursos.map(curso => {
    const total = fp.filter(p => p.curso === curso && p.status === 'PAGO').reduce((a, c) => a + c.valorAtual, 0);
    return {
      name: curso.replace('Pós-Graduação em ', '').replace('Especialização em ', '').replace('Aperfeiçoamento em ', '').replace('MBA em ', ''),
      value: total
    };
  }).filter(i => i.value > 0);

  // Status breakdown
  const statusData = [
    { name: 'A Vencer (Pendente)', value: fp.filter(p => p.status === 'PENDENTE').length, color: '#ff8000' },
    { name: 'Atrasadas', value: fp.filter(p => p.status === 'ATRASADO').length, color: '#ef4444' },
    { name: 'Pagas', value: fp.filter(p => p.status === 'PAGO').length, color: '#10b981' },
    { name: 'Negociadas', value: fp.filter(p => p.status === 'NEGOCIADO').length, color: '#3b82f6' }
  ];

  const CHART_COLORS = ['#03045e', '#ff8000', '#00b4d8', '#ffb703', '#4ea8de', '#ef4444'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#03045e] to-[#050c5a] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 bg-white/5 h-48 w-48 rounded-full blur-2xl" />
        <div className="z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-orange-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Plataforma Ativa</span>
            <span className="text-blue-200 text-xs font-medium">Parceria Instituto Sentidos & FAEPI</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Gestão Financeira de Mensalidades</h1>
          <p className="text-sm text-blue-100 mt-1 max-w-xl">
            Acompanhe parcelas, recupere inadimplência com a régua automática e registre pagamentos e negociações em tempo real.
          </p>
        </div>
        <div className="z-10 flex gap-2 w-full md:w-auto">
          <button onClick={() => onSetTab('alunos')} className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-lg cursor-pointer transition">
            Cadastrar / Importar Alunos
          </button>
          <button onClick={() => onSetTab('parcelas')} className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs px-4 py-2.5 rounded-lg cursor-pointer transition">
            Ver Parcelas
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#03045e]/10 text-[#03045e] rounded-lg"><Filter className="h-4 w-4" /></div>
          <div>
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Filtros da Instituição</h2>
            <p className="text-[10px] text-gray-400">Dados filtrados por Polo regional e Especialidade acadêmica</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700">
            <span className="font-semibold text-slate-500">Polo:</span>
            <select value={filterPolo} onChange={(e) => setFilterPolo(e.target.value)} className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-bold text-[#03045e]">
              <option value="ALL">Todos os Polos</option>
              {listPolos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 max-w-xs">
            <span className="font-semibold text-slate-500">Curso:</span>
            <select value={filterCurso} onChange={(e) => setFilterCurso(e.target.value)} className="bg-transparent border-0 focus:outline-hidden text-xs cursor-pointer font-bold text-[#03045e] truncate">
              <option value="ALL">Todos os Cursos</option>
              {listCursos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {(filterCurso !== 'ALL' || filterPolo !== 'ALL') && (
            <button onClick={() => { setFilterCurso('ALL'); setFilterPolo('ALL'); }} className="px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100/50 rounded-lg text-xs font-bold transition cursor-pointer">
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} tint="blue" label="Receita Prevista" value={brl(receitaPrevista)} hint="Soma do valor original contratado" />
        <KpiCard icon={<DollarSign className="h-4 w-4" />} tint="emerald" label="Receita Recebida" value={brl(receitaRecebida)} hint="Parcelas pagas" />
        <KpiCard icon={<Clock className="h-4 w-4" />} tint="amber" label="Receita em Aberto" value={brl(receitaEmAberto)} hint="Pendentes, atrasadas e negociadas" />
        <KpiCard icon={<Handshake className="h-4 w-4" />} tint="indigo" label="Recuperado (Negociação)" value={brl(receitaRecuperada)} hint="Acordos pagos" />

        <KpiCard icon={<AlertOctagon className="h-4 w-4" />} tint="rose" label="Parcelas Vencidas" value={String(parcelasVencidas.length)} hint={brl(totalVencidoValor)} />
        <KpiCard icon={<CalendarClock className="h-4 w-4" />} tint="orange" label="Parcelas a Vencer" value={String(parcelasAVencer.length)} hint="Próximas mensalidades" />
        <KpiCard icon={<Users className="h-4 w-4" />} tint="slate" label="Alunos" value={String(totalAlunos)} hint={`${adimplentes} adimplentes · ${inadimplentes} inadimplentes`} />
        <KpiCard icon={<Percent className="h-4 w-4" />} tint="emerald" label="Taxa de Recuperação" value={`${taxaRecuperacao.toFixed(1)}%`} hint={`Inadimplência: ${taxaInadimplencia.toFixed(1)}%`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Status das Parcelas</h3>
            <p className="text-xs text-gray-400">Proporção das parcelas por situação financeira</p>
          </div>
          <div className="space-y-4 my-2">
            {statusData.some(i => i.value > 0) ? statusData.map((item) => {
              const totalItems = statusData.reduce((p, c) => p + c.value, 0);
              const pct = totalItems > 0 ? (item.value / totalItems) * 100 : 0;
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-700 flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-bold text-gray-900 font-mono">{item.value} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            }) : (
              <div className="py-12 text-center text-gray-400 text-xs font-semibold">Nenhuma parcela para esta seleção.</div>
            )}
          </div>
          <div className="mt-4 p-3 bg-blue-50/10 rounded-xl border border-blue-100/50 flex gap-3 text-xs text-slate-600">
            <Lightbulb className="h-5 w-5 text-orange-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold text-slate-800 block">Dica de Recuperação:</span>
              <span>Disparos 1 dia após o vencimento têm a melhor taxa de conversão. Mantenha a régua de WhatsApp ativa.</span>
            </div>
          </div>
        </div>

        {/* Receita por curso */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Receita Recebida por Especialização</h3>
            <p className="text-xs text-gray-400">Distribuição dos pagamentos consolidados</p>
          </div>
          <div className="h-72 flex flex-col md:flex-row items-center justify-between gap-4">
            {receitaPorCurso.length > 0 ? (
              <>
                <div className="w-full md:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={receitaPorCurso} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                        {receitaPorCurso.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {receitaPorCurso.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="text-gray-600 font-semibold truncate max-w-[135px]" title={item.name}>{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-800 shrink-0">{brl(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full py-16 text-center text-gray-400 text-xs font-semibold">Nenhum recebimento consolidado para o filtro.</div>
            )}
          </div>
        </div>

        {/* Inadimplência por Turma */}
        <ChartBar title="Inadimplência por Turma" subtitle="Valor atrasado agrupado por turma" data={inadByTurma} color="#ef4444" />
        {/* Inadimplência por Polo */}
        <ChartBar title="Inadimplência por Polo" subtitle="Valor atrasado agrupado por polo" data={inadByPolo} color="#ff8000" />
      </div>

      {/* Inadimplência por Curso (full width bar) */}
      <ChartBar title="Inadimplência por Curso" subtitle="Valor atrasado agrupado por especialização" data={inadByCurso} color="#03045e" full />

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Registro de Ocorrências Recentes</h3>
            <p className="text-xs text-gray-400">Logs de sistema, disparos Evolution API e atualizações LeadConnector</p>
          </div>
          <button onClick={() => onSetTab('configurações')} className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">Ver fluxo completo &rarr;</button>
        </div>
        <div className="divide-y divide-gray-100">
          {logs.slice(0, 4).map((log) => (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs transition hover:bg-gray-50/50 px-2 rounded-lg">
              <div className="flex gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                  log.tipo === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-700'
                    : log.tipo === 'CRM' ? 'bg-blue-50 text-blue-700'
                      : log.tipo === 'IMPORTACAO' ? 'bg-purple-50 text-purple-700'
                        : 'bg-amber-50 text-amber-700'
                }`}>{log.tipo}</span>
                <div className="space-y-0.5">
                  <p className="font-medium text-gray-800 leading-tight">{log.detalhe}</p>
                  <p className="text-[10px] text-gray-400">Disparado por {log.usuario || 'Automação'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-mono">{log.timestamp}</span>
                {log.sucesso
                  ? <span className="text-[10px] font-mono text-emerald-600 font-semibold">Sucesso</span>
                  : <span className="text-[10px] font-mono text-red-600 font-semibold">Falha</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const tints: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  rose: 'bg-rose-50 text-rose-600',
  orange: 'bg-orange-50 text-[#ff8000]',
  slate: 'bg-slate-100 text-slate-600'
};

function KpiCard({ icon, tint, label, value, hint }: { icon: React.ReactNode; tint: string; label: string; value: string; hint: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <div className={`p-1.5 rounded-lg ${tints[tint]}`}>{icon}</div>
      </div>
      <div className="mt-2">
        <span className="text-lg font-bold text-gray-950 font-mono">{value}</span>
        <p className="text-[10px] font-medium text-gray-400 mt-0.5">{hint}</p>
      </div>
    </div>
  );
}

function ChartBar({ title, subtitle, data, color, full }: { title: string; subtitle: string; data: { name: string; value: number }[]; color: string; full?: boolean }) {
  return (
    <div className={`bg-white rounded-xl p-5 border border-gray-100 shadow-sm ${full ? 'lg:col-span-2' : ''}`}>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">{title}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={120} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Atrasado" fill={color} radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-xs font-semibold">Sem inadimplência registrada nesta seleção. 🎉</div>
        )}
      </div>
    </div>
  );
}
