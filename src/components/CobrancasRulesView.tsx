import React, { useState } from 'react';
import { 
  Sliders, 
  MessageSquare, 
  Clock, 
  CalendarDays, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Edit2, 
  Save, 
  Undo,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { CobrancaRegra } from '../types';

interface CobrancasRulesViewProps {
  regras: CobrancaRegra[];
  onSaveRegras: (noRegras: CobrancaRegra[]) => void;
  onPostAlert: (msg: string, type: 'success' | 'warning' | 'error') => void;
}

export default function CobrancasRulesView({ regras, onSaveRegras, onPostAlert }: CobrancasRulesViewProps) {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [tempTemplate, setTempTemplate] = useState('');
  const [tempHorario, setTempHorario] = useState('09:00');
  const [tempDiasGatilho, setTempDiasGatilho] = useState(1);
  const [tempCanal, setTempCanal] = useState<'WHATSAPP' | 'EMAIL' | 'AMBOS'>('WHATSAPP');
  const [tempDestinatario, setTempDestinatario] = useState<'ALUNO' | 'EQUIPE_INTERNA'>('ALUNO');

  // Template replacements simulator for rendering Live Previews
  const getSimulatedPreviewText = (template: string) => {
    return template
      .replace(/{nome_aluno}/g, 'Mariana Silva Santos')
      .replace(/{curso}/g, 'Pós-Graduação em Neuropsicologia Clínica')
      .replace(/{valor}/g, 'R$ 450,00')
      .replace(/{vencimento}/g, '10/06/2026')
      .replace(/{parcela}/g, '08/18');
  };

  const handleToggleActive = (ruleId: string) => {
    const updated = regras.map(r => {
      if (r.id === ruleId) {
        const nextState = !r.ativo;
        onPostAlert(`Etapa "${r.titulo}" foi ${nextState ? 'Habilitada' : 'Desabilitada'} na régua!`, nextState ? 'success' : 'warning');
        return { ...r, ativo: nextState };
      }
      return r;
    });
    onSaveRegras(updated);
  };

  const startEditing = (rule: CobrancaRegra) => {
    setEditingRuleId(rule.id);
    setTempTemplate(rule.mensagemTemplate);
    setTempHorario(rule.horarioEnvio);
    setTempDiasGatilho(rule.diasGatilho);
    setTempCanal(rule.canal || 'WHATSAPP');
    setTempDestinatario(rule.destinatario || 'ALUNO');
  };

  const cancelEditing = () => {
    setEditingRuleId(null);
  };

  const saveRuleChanges = (ruleId: string) => {
    const updated = regras.map(r => {
      if (r.id === ruleId) {
        return { 
          ...r, 
          mensagemTemplate: tempTemplate, 
          horarioEnvio: tempHorario,
          diasGatilho: tempDiasGatilho,
          canal: tempCanal,
          destinatario: tempDestinatario
        };
      }
      return r;
    });
    onSaveRegras(updated);
    setEditingRuleId(null);
    onPostAlert('Template da etapa atualizado e implantado na fila operacional do CRM!', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Régua de Cobrança Automatizada</h1>
          <p className="text-xs text-gray-400 font-sans">Desenhe a esteira de alertas e recupere as parcelas do Instituto Sentidos / FAEPI sem fricção</p>
        </div>
        
        {/* Global indicators */}
        <div className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-lg border border-emerald-200 font-bold flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
          <span>Fila de Disparos Ativa: {regras.filter(r=>r.ativo).length} Estágios</span>
        </div>
      </div>

      {/* Rules Loop */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Stages List (Left Side - Spans 2) */}
        <div className="xl:col-span-2 space-y-4">
          {regras.map((regra, idx) => {
            const isEditing = editingRuleId === regra.id;
            return (
              <div 
                key={regra.id} 
                className={`bg-white rounded-xl border p-5 transition shadow-xs ${
                  regra.ativo 
                    ? 'border-gray-100 hover:shadow-md' 
                    : 'border-slate-200 bg-slate-50/50 opacity-80'
                }`}
              >
                {/* Stage Header Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-50 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 font-bold bg-[#03045e] text-white text-xs rounded-full flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        {regra.titulo}
                        {!regra.ativo && (
                          <span className="text-[9px] bg-gray-200 text-gray-600 border px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Desativado</span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">{regra.descricao}</p>
                    </div>
                  </div>

                  {/* Toggle Activator button */}
                  <button 
                    onClick={() => handleToggleActive(regra.id)}
                    className="cursor-pointer font-bold inline-flex items-center"
                  >
                    {regra.ativo ? (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs">
                        <span className="font-semibold text-[11px]">Estágio Ativo</span>
                        <ToggleRight className="h-8 w-8 text-emerald-600 " />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <span className="font-semibold text-[11px]">Desativado</span>
                        <ToggleLeft className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Body: Configuration display / Forms */}
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Trigger variables */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Gatilho Temporal (Dias)</label>
                        <div className="flex items-center gap-2 text-xs">
                          <input 
                            type="number" 
                            value={tempDiasGatilho}
                            onChange={(e) => setTempDiasGatilho(Number(e.target.value))}
                            className="bg-gray-50 border border-gray-200 rounded p-1.5 w-20 text-center font-bold"
                          />
                          <span className="text-gray-500 font-medium">
                            {tempDiasGatilho < 0 
                              ? 'Dias ANTES do dia de vencimento' 
                              : tempDiasGatilho === 0 
                                ? 'No exato dia do vencimento' 
                                : 'Dias DEPOIS do vencimento não identificado'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Horário Recomendado Disparo</label>
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-4 w-4 text-gray-450 text-gray-400" />
                          <input 
                            type="text" 
                            placeholder="Ex: 09:00"
                            value={tempHorario}
                            onChange={(e) => setTempHorario(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded p-1.5 w-24 text-center font-semibold font-mono"
                          />
                          <span className="text-gray-400">Fuso Horário Brasília</span>
                        </div>
                      </div>
                    </div>

                    {/* Channel & Recipient selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Canal de Envio</label>
                        <select
                          value={tempCanal}
                          onChange={(e) => setTempCanal(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="EMAIL">E-mail</option>
                          <option value="AMBOS">Ambos (WhatsApp + E-mail)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Destinatário do Alerta</label>
                        <select
                          value={tempDestinatario}
                          onChange={(e) => setTempDestinatario(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="ALUNO">Aluno (Estudante)</option>
                          <option value="EQUIPE_INTERNA">Equipe Interna (Operações)</option>
                        </select>
                      </div>
                    </div>

                    {/* Template Field */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase mb-1">
                        <span>Texto da Mensagem de WhatsApp</span>
                        <span className="text-orange-500 font-semibold lowercase">tags disponíveis abaixo</span>
                      </div>
                      <textarea
                        value={tempTemplate}
                        onChange={(e) => setTempTemplate(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 p-3 rounded-lg text-xs text-gray-800 h-28 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed"
                      />
                    </div>

                    {/* Save Buttons */}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => saveRuleChanges(regra.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.8 rounded-md transition cursor-pointer flex items-center gap-1"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Salvar Modificações</span>
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs px-3.5 py-1.8 rounded-md transition cursor-pointer"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visual Configuration specs */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-gray-600 bg-slate-50/50 p-2.5 rounded-lg">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-[#ff8000]" />
                        Gatilho: {regra.diasGatilho === 0 ? 'No vencimento' : `${Math.abs(regra.diasGatilho)} dias ${regra.diasGatilho < 0 ? 'antes' : 'depois'}`}
                      </span>
                      <span className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                        <Clock className="h-4 w-4 text-blue-800" />
                        Disparo às: {regra.horarioEnvio}hs
                      </span>
                      <span className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                        Canal: {regra.canal === 'WHATSAPP' ? 'WhatsApp' : regra.canal === 'EMAIL' ? 'E-mail' : 'Ambos'}
                      </span>
                      <span className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                        <Info className="h-4 w-4 text-indigo-500" />
                        Destinatário: {regra.destinatario === 'EQUIPE_INTERNA' ? 'Equipe Interna' : 'Aluno'}
                      </span>
                    </div>

                    {/* Template Display */}
                    <div className="space-y-1 bg-[#03045e]/5 rounded-lg p-3 text-xs">
                      <span className="text-[10px] font-bold text-[#03045e] uppercase">Template Base:</span>
                      <p className="text-gray-700 italic leading-relaxed">{regra.mensagemTemplate}</p>
                    </div>

                    {/* Interactive Button edit */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => startEditing(regra)}
                        className="bg-gray-100 text-gray-700 hover:bg-[#03045e]/10 hover:text-[#03045e] font-bold text-xs px-3.5 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Editar Configurações</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Tags and Live Preview (Right Column - Spans 1) */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Dynamic Mock Preview widget (Reactive to Selected Rule edit!) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-3.5">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2">Simulação de Smartphone</h4>
            <p className="text-[11px] text-gray-400">Esta é uma prévia renderizada instantaneamente de como o estudante Mariana Silva receberá no celular:</p>
            
            {/* Phone Simulation mock structure */}
            <div className="bg-slate-900 rounded-3xl p-3 shadow-xl max-w-xs mx-auto border-4 border-slate-800">
              {/* Speaker / camera notch inside mockup */}
              <div className="h-4 w-20 bg-slate-800 rounded-full mx-auto mb-3" />
              
              <div className="bg-emerald-50 text-gray-800 rounded-xl p-3 min-h-48 flex flex-col justify-between text-[11px] leading-relaxed relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 bg-emerald-100 h-12 w-12 rounded-full opacity-50" />
                
                <div>
                  <div className="flex justify-between items-center text-[9px] text-emerald-700 font-bold border-b border-emerald-150 pb-1 mb-2">
                    <span>INSTITUTO SENTIDOS / REGUA</span>
                    <span>12:39 PM</span>
                  </div>
                  
                  <p className="font-semibold text-gray-900 whitespace-pre-wrap">
                    {getSimulatedPreviewText(editingRuleId ? tempTemplate : regras.find(r=>r.ativo)?.mensagemTemplate || regras[0]?.mensagemTemplate || '')}
                  </p>
                </div>

                <div className="mt-3 text-[9px] text-gray-400 text-right font-medium">
                  ✓✓ Entregue por Evolution API
                </div>
              </div>
            </div>
          </div>

          {/* Tokens Helper list */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-3.5">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-[#ff8000]" />
              Tags de Substituição
            </h4>
            <p className="text-[11px] text-gray-400">Copie e cole estes tokens exatos ao redigir seus templates. O motor financeiro fará a substituição em lote:</p>

            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                <code className="text-orange-600 font-bold bg-orange-50 px-1 py-0.5 rounded">{"{nome_aluno}"}</code>
                <span className="text-gray-500">Nome completo do aluno</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                <code className="text-orange-600 font-bold bg-orange-50 px-1 py-0.5 rounded">{"{curso}"}</code>
                <span className="text-gray-500">Curso cadastrado</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                <code className="text-orange-600 font-bold bg-orange-50 px-1 py-0.5 rounded">{"{parcela}"}</code>
                <span className="text-gray-500">Número da parcela (ex: 08/18)</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                <code className="text-orange-600 font-bold bg-orange-50 px-1 py-0.5 rounded">{"{valor}"}</code>
                <span className="text-gray-500">Valor atual com R$</span>
              </div>
              <div className="flex justify-between items-center">
                <code className="text-orange-600 font-bold bg-orange-50 px-1 py-0.5 rounded">{"{vencimento}"}</code>
                <span className="text-gray-500">Data de vencimento</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
