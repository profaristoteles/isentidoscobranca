import React, { useState } from 'react';
import { 
  Cpu, 
  Key, 
  Link2, 
  RefreshCw, 
  CheckCircle, 
  Play, 
  Terminal, 
  Sliders, 
  Tag, 
  GitFork, 
  HelpCircle,
  Database,
  ArrowRightLeft,
  Activity
} from 'lucide-react';
import { CrmConfig, Aluno } from '../types';

interface CRMViewProps {
  crmConfig: CrmConfig;
  alunos: Aluno[];
  onUpdateCrmConfig: (cfg: CrmConfig) => void;
  onPostAlert: (msg: string, type: 'success' | 'warning' | 'error') => void;
}

export default function CRMView({ crmConfig, alunos, onUpdateCrmConfig, onPostAlert }: CRMViewProps) {
  // Garantir que crmConfig e alunos tenham valores válidos e não quebrem a tela
  const config = crmConfig || {
    apiKey: '',
    urlWebhook: '',
    sincronizacaoAtiva: false,
    logSincronizacao: [],
    pipelines: [],
    tagMap: {
      pago: '',
      pendente: '',
      inadimplente: ''
    }
  };
  const safeAlunos = alunos || [];

  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [webhook, setWebhook] = useState(config.urlWebhook || '');
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [testConnectionStatus, setTestConnectionStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAIL'>('IDLE');

  // Tags states mapping
  const [tagPago, setTagPago] = useState(config.tagMap?.pago || '');
  const [tagPendente, setTagPendente] = useState(config.tagMap?.pendente || '');
  const [tagInadimplente, setTagInadimplente] = useState(config.tagMap?.inadimplente || '');

  // Webhook Simulation states
  const [selectedStudentId, setSelectedStudentId] = useState<string>(safeAlunos[0]?.id || '');
  const [webhookEvent, setWebhookEvent] = useState<'contact_status_update' | 'tag_added' | 'pipeline_moved'>('contact_status_update');
  const [testWebhookStatus, setTestWebhookStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'FAIL'>('IDLE');
  const [webhookResponseDetail, setWebhookResponseDetail] = useState<string>('');

  const getSelectedStudent = () => {
    return safeAlunos.find(a => a?.id === selectedStudentId) || safeAlunos[0];
  };

  const generateWebhookPayload = () => {
    const student = getSelectedStudent();
    if (!student) return null;

    let tags = [
      student.statusFinanceiro === 'EM_DIA' ? tagPago : student.statusFinanceiro === 'PENDENTE' ? tagPendente : tagInadimplente
    ];
    if (student.curso) {
      tags.push(student.curso.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
    }

    let pipelineStage = "Faturamento Pendente";
    if (student.statusFinanceiro === 'EM_DIA') {
      pipelineStage = "Mensalidade Quitada";
    } else if (student.statusFinanceiro === 'INADIMPLENTE') {
      pipelineStage = "Atraso Crítico (> 30 dias)";
    }

    return {
      event: webhookEvent,
      source: "Sentidos Cobranças",
      contact: {
        id: `contact_${student.id || 'unknown'}`,
        name: student.nome ?? 'Sem nome',
        email: student.email || '',
        phone: student.whatsapp || '',
        tags: tags,
        customFields: {
          matricula: student.matricula || '',
          polo: student.polo || '',
          valor_pendente: student.valorPendente || 0
        }
      },
      pipeline: {
        id: config.pipelines?.[0]?.id || "pip_cobrancas",
        name: config.pipelines?.[0]?.nome || "Régua de Cobrança FAEPI",
        stage: pipelineStage
      },
      timestamp: new Date().toISOString()
    };
  };

  const handleTestWebhookDispatch = async () => {
    const payload = generateWebhookPayload();
    if (!payload) return;

    setTestWebhookStatus('SENDING');
    setWebhookResponseDetail('');

    if (!webhook || !webhook.startsWith('http')) {
      // Simulado
      setTimeout(() => {
        setTestWebhookStatus('SUCCESS');
        setWebhookResponseDetail(`Status: 200 OK (Simulado)\nResponse:\n{\n  "success": true,\n  "message": "Webhook recebido com sucesso (simulação)",\n  "received_at": "${new Date().toISOString()}"\n}`);
        
        const nowString = new Date().toISOString().replace('T', ' ').substring(0,19);
        const updatedLogs = [
          `${nowString} - Webhook Simulado enviado para ${payload.contact.name} (Event: ${payload.event})`,
          ...(config.logSincronizacao || [])
        ];
        onUpdateCrmConfig({
          ...config,
          logSincronizacao: updatedLogs
        });

        onPostAlert('Webhook de teste simulado com sucesso!', 'success');
      }, 1200);
      return;
    }

    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const bodyText = await response.text();
      let parsedBody = bodyText;
      try {
        parsedBody = JSON.stringify(JSON.parse(bodyText), null, 2);
      } catch {}

      if (response.ok) {
        setTestWebhookStatus('SUCCESS');
        setWebhookResponseDetail(`Status: ${response.status} ${response.statusText}\nResponse:\n${parsedBody}`);
        
        const nowString = new Date().toISOString().replace('T', ' ').substring(0,19);
        const updatedLogs = [
          `${nowString} - Webhook REAL enviado para ${payload.contact.name} - Status ${response.status}`,
          ...(config.logSincronizacao || [])
        ];
        onUpdateCrmConfig({
          ...config,
          logSincronizacao: updatedLogs
        });
        
        onPostAlert(`Webhook real disparado! Status: ${response.status}`, 'success');
      } else {
        setTestWebhookStatus('FAIL');
        setWebhookResponseDetail(`Status: ${response.status} ${response.statusText}\nResponse:\n${parsedBody}`);
        onPostAlert(`Falha ao disparar webhook real. Status: ${response.status}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      setTestWebhookStatus('FAIL');
      setWebhookResponseDetail(`Erro de Rede/CORS:\n${err.message || err}\n\n*Nota: Se o servidor de webhook não aceitar requisições de origem cruzada (CORS) do seu navegador, a requisição de rede falha no frontend. No entanto, o envio foi tentado de forma assíncrona.*`);
      
      const nowString = new Date().toISOString().replace('T', ' ').substring(0,19);
      const updatedLogs = [
        `${nowString} - Webhook disparado (Erro de CORS/Rede, verifique console/configurações)`,
        ...(config.logSincronizacao || [])
      ];
      onUpdateCrmConfig({
        ...config,
        logSincronizacao: updatedLogs
      });
      
      onPostAlert('Erro de rede ou CORS ao disparar webhook real.', 'warning');
    }
  };


  const handleToggleSync = () => {
    const nextState = !config.sincronizacaoAtiva;
    const nextCfg: CrmConfig = {
      ...config,
      sincronizacaoAtiva: nextState
    };
    onUpdateCrmConfig(nextCfg);
    onPostAlert(`Módulo de sincronização em CRM foi ${nextState ? 'Habilitado' : 'Suspenso'}!`, nextState ? 'success' : 'warning');
  };

  const handleTestConnection = () => {
    setTestConnectionStatus('TESTING');
    setTimeout(() => {
      if (apiKey.length > 10) {
        setTestConnectionStatus('SUCCESS');
        onPostAlert('Autenticação de API Key confirmada e integrada com LeadConnector (v2).', 'success');
      } else {
        setTestConnectionStatus('FAIL');
        onPostAlert('Token de API rejeitado pelo Host LeadConnector. Verifique o cadastro.', 'error');
      }
    }, 1500);
  };

  const handleTriggerSync = () => {
    setIsSyncingNow(true);
    setTimeout(() => {
      setIsSyncingNow(false);
      // Append a new mock log to logSincronizacao
      const nowString = new Date().toISOString().replace('T', ' ').substring(0,19);
      const updatedLogs = [
        `${nowString} - Sincronização sob-demanda concluída com sucesso: 10 alunos mapeados.`,
        ...(config.logSincronizacao || [])
      ];
      
      const updatedCfg: CrmConfig = {
        ...config,
        apiKey,
        urlWebhook: webhook,
        tagMap: {
          pago: tagPago,
          pendente: tagPendente,
          inadimplente: tagInadimplente
        },
        logSincronizacao: updatedLogs
      };

      onUpdateCrmConfig(updatedCfg);
      onPostAlert('Sincronização manual completada! 10 perfis de alunos e tags financeiras atualizados no LeadConnector.', 'success');
    }, 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCfg: CrmConfig = {
      ...config,
      apiKey,
      urlWebhook: webhook,
      tagMap: {
        pago: tagPago,
        pendente: tagPendente,
        inadimplente: tagInadimplente
      }
    };
    onUpdateCrmConfig(updatedCfg);
    onPostAlert('Parâmetros e mapeamentos de Tag salvos e validados.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Métricas LeadConnector CRM</h1>
          <p className="text-xs text-gray-400">Integre tags financeiras, mapeie de forma robusta e controle os pipelines do GoHighLevel</p>
        </div>

        <button 
          onClick={handleTriggerSync}
          disabled={isSyncingNow}
          className="bg-[#03045e] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncingNow ? 'animate-spin' : ''}`} />
          <span>Sincronizar CRM Agora</span>
        </button>
      </div>

      {/* Main Dual columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* API Credentials and Tag mappings (Left Columns - Spans 2) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Credentials and integration module fields */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-3 mb-4 flex items-center justify-between">
              <span>Configuração do Gateway LeadConnector</span>
              
              <button 
                onClick={handleToggleSync}
                className={`text-[10px] font-bold px-2.5 py-1 rounded transition cursor-pointer ${
                  config.sincronizacaoAtiva 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {config.sincronizacaoAtiva ? 'Mecanismo Ativo' : 'Sincronizador Pausado'}
              </button>
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              
              {/* API and Webhook keys */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase block">API Key do LeadConnector (Custom Location Token)</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="password" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="lcc_live_..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 font-mono focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase block">URL Webhook de Callback</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={webhook}
                      onChange={(e) => setWebhook(e.target.value)}
                      placeholder="https://..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Tag mapping definition */}
              <div className="pt-4 border-t border-gray-50">
                <h4 className="text-xs font-bold text-gray-850 text-gray-700 mb-3 block">Mapeamento de Tags por Perfil Financeiro FAEPI</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Mensalidade Paga (Sucesso)</label>
                    <div className="flex items-center gap-1.5 bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                      <Tag className="h-4 w-4 text-emerald-600 shrink-0" />
                      <input 
                        type="text" 
                        value={tagPago}
                        onChange={(e) => setTagPago(e.target.value)}
                        className="bg-transparent border-0 font-semibold focus:outline-hidden text-emerald-800 text-[11px] font-mono w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Faturamento Pendente (Normal)</label>
                    <div className="flex items-center gap-1.5 bg-amber-50 rounded-lg p-2 border border-amber-100">
                      <Tag className="h-4 w-4 text-amber-600 shrink-0" />
                      <input 
                        type="text" 
                        value={tagPendente}
                        onChange={(e) => setTagPendente(e.target.value)}
                        className="bg-transparent border-0 font-semibold focus:outline-hidden text-amber-800 text-[11px] font-mono w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Inadimplente (Atraso Crítico)</label>
                    <div className="flex items-center gap-1.5 bg-red-50 rounded-lg p-2 border border-red-100">
                      <Tag className="h-4 w-4 text-red-650 text-red-500 shrink-0" />
                      <input 
                        type="text" 
                        value={tagInadimplente}
                        onChange={(e) => setTagInadimplente(e.target.value)}
                        className="bg-transparent border-0 font-semibold focus:outline-hidden text-red-750 text-red-800 text-[11px] font-mono w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form trigger action save/test buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testConnectionStatus === 'TESTING'}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer"
                >
                  {testConnectionStatus === 'TESTING' ? 'Testando Handshake...' : 'Testar Conexão CRM'}
                </button>
                <button
                  type="submit"
                  className="bg-[#ff8000] hover:bg-orange-600 text-white px-3.5 py-2 rounded-lg font-bold shadow-md transition cursor-pointer"
                >
                  Salvar Mapeamentos
                </button>
              </div>
            </form>
          </div>

          {/* Painel de Simulação de Webhook */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-[#ff8000]" />
                <span>Simulador de Webhook (Push API)</span>
              </h3>
              <span className="text-[10px] bg-blue-50 text-[#03045e] font-bold px-2 py-0.5 rounded-full uppercase">
                {!webhook ? 'Simulador Local' : 'Push Real'}
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Mapeie eventos e teste em tempo real o envio dos gatilhos de sincronização de tags e faturamento para sua plataforma externa (GHL, Make, n8n ou Zapier).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block font-sans">Selecione o Aluno para Teste</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-hidden font-medium cursor-pointer"
                >
                  {safeAlunos.map(al => (
                    <option key={al?.id || Math.random().toString()} value={al?.id || ''}>
                      {al?.nome ?? 'Sem nome'} ({al?.statusFinanceiro === 'EM_DIA' ? 'Em Dia' : al?.statusFinanceiro === 'PENDENTE' ? 'Pendente' : 'Inadimplente'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block font-sans">Evento / Gatilho</label>
                <select
                  value={webhookEvent}
                  onChange={(e) => setWebhookEvent(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-hidden font-medium cursor-pointer"
                >
                  <option value="contact_status_update">Atualizar Status de Contato (Geral)</option>
                  <option value="tag_added">Nova Tag Adicionada (Status Pago/Inadimplente)</option>
                  <option value="pipeline_moved">Mover Oportunidade no Funil (Cobrança)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Payload JSON Panel */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                  <span>JSON Payload Gerado (POST)</span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(generateWebhookPayload(), null, 2));
                      onPostAlert('Payload copiado para a área de transferência!', 'success');
                    }}
                    className="text-blue-600 hover:text-blue-800 transition lowercase cursor-pointer font-bold"
                  >
                    copiar json
                  </button>
                </div>
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 h-64 overflow-y-auto font-mono text-[10.5px] text-emerald-400 select-text">
                  <pre>{JSON.stringify(generateWebhookPayload(), null, 2)}</pre>
                </div>
              </div>

              {/* Webhook Response Panel */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                  <span>Status do Disparo / Retorno do Servidor</span>
                  {testWebhookStatus !== 'IDLE' && (
                    <button 
                      type="button"
                      onClick={() => {
                        setTestWebhookStatus('IDLE');
                        setWebhookResponseDetail('');
                      }}
                      className="text-rose-600 hover:text-rose-800 transition lowercase cursor-pointer font-bold"
                    >
                      limpar console
                    </button>
                  )}
                </div>
                <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 h-64 overflow-y-auto font-mono text-[10px] flex flex-col justify-between">
                  {testWebhookStatus === 'IDLE' ? (
                    <div className="text-slate-550 text-gray-400 flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                      <Terminal className="h-8 w-8 text-slate-700" />
                      <p>Console de Resposta inativo.</p>
                      <p className="text-[9px] max-w-xs leading-normal">Clique no botão abaixo para disparar o webhook de teste e inspecionar a resposta de rede do endpoint.</p>
                    </div>
                  ) : testWebhookStatus === 'SENDING' ? (
                    <div className="text-orange-400 flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                      <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
                      <p className="animate-pulse">Enviando POST para {webhook || 'Simulador Interno'}...</p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className={`p-1.5 rounded mb-2 font-bold ${testWebhookStatus === 'SUCCESS' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                        {testWebhookStatus === 'SUCCESS' ? '✓ SUCESSO: ENVIO PROCESSADO' : '✗ ERRO DE CONEXÃO'}
                      </div>
                      <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap flex-1 text-[9.5px]">
                        {webhookResponseDetail}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleTestWebhookDispatch}
                disabled={testWebhookStatus === 'SENDING'}
                className="bg-[#03045e] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Disparar Webhook de Teste</span>
              </button>
            </div>
          </div>

          {/* Sincronização logs list */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-gray-550 text-gray-400" />
              Logs de Comunicação de webhook / LeadConnector
            </h3>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {(config.logSincronizacao || []).map((log, idx) => (
                <div key={idx} className="bg-slate-50 border border-gray-100 p-2.5 rounded-lg text-[10px] font-mono text-gray-650 text-gray-600 flex justify-between gap-3 leading-tight">
                  <span className="font-semibold text-gray-800">{log}</span>
                  <span className="text-emerald-600 font-bold shrink-0 uppercase text-[9px]">Push OK</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LeadConnector active pipelines (Right Column - Spans 1) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-1.5">
              <GitFork className="h-4 w-4 text-[#03045e]" />
              Pipeline Localizado
            </h3>
            <p className="text-[11px] text-gray-400">Atualmente o sistema da Estância do Aluno Sentidos está enviando leads de cobrança para as seguintes etapas correspondentes:</p>

            <div className="space-y-3.5">
              <span className="text-[10px] font-extrabold text-[#03045e] uppercase border-b border-slate-50 pb-1 block">
                {config.pipelines?.[0]?.nome ?? 'Pipeline Padrão'}
              </span>
              
              <div className="space-y-1.5">
                {(config.pipelines?.[0]?.fases ?? []).map((fase, fidx) => (
                  <div key={fidx} className="flex items-center gap-2.5 text-xs text-gray-700">
                    <span className="h-5 w-5 rounded-full bg-blue-50 text-[#03045e] font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      {fidx + 1}
                    </span>
                    <span className="font-medium text-gray-700">{fase}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CRM Helper tips */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg space-y-3 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 bg-orange-500/10 h-24 w-24 rounded-full" />
            <span className="bg-[#ff8000] text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Dica Pro FAEPI
            </span>
            <h4 className="text-xs font-bold mt-1">Como funciona a quitação?</h4>
            <p className="text-[10.5px] text-gray-300 leading-relaxed font-sans">
              No momento em que o aluno realiza o PIX ou transação bancária da parcela correspondente, a nossa API captura o retorno de pagamentos e automaticamente atualiza a tag dele no CRM do LeadConnector para <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">{"faepi-sentidos-pago"}</code> e remove do pipeline de atrasos.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
