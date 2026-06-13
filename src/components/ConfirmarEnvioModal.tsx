import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Mail, 
  Info, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Aluno, Parcela, CobrancaRegra, SmtpConfig } from '../types';
import { formatParcela } from '../utils/parcelas';

interface ConfirmarEnvioModalProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: Aluno | null;
  parcela: Parcela | null;
  regras: CobrancaRegra[];
  smtpConfig: SmtpConfig;
  onConfirm: (canal: 'WHATSAPP' | 'EMAIL', text: string, subject?: string, destinatario?: 'ALUNO' | 'EQUIPE_INTERNA') => void;
}

export default function ConfirmarEnvioModal({
  isOpen,
  onClose,
  aluno,
  parcela,
  regras,
  smtpConfig,
  onConfirm
}: ConfirmarEnvioModalProps) {
  const [canal, setCanal] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');

  // Pre-select canal based on SMTP status and rule availability, or default to WhatsApp
  useEffect(() => {
    if (isOpen) {
      setCanal('WHATSAPP');
      setSelectedRuleId('');
      setSubject('');
      setMessageText('');
    }
  }, [isOpen]);

  // Helper to compile template tokens
  const buildText = (template: string, currentAluno: Aluno, currentParcela: Parcela) => {
    return template
      .replace(/{nome_aluno}/g, currentAluno.nome)
      .replace(/{curso}/g, currentAluno.curso)
      .replace(/{valor}/g, `R$ ${currentParcela.valorAtual.toFixed(2)}`)
      .replace(/{vencimento}/g, currentParcela.vencimento)
      .replace(/{parcela}/g, formatParcela(currentParcela));
  };

  // Update subject and message text when rule or canal changes
  useEffect(() => {
    if (!aluno || !parcela) return;

    // Default subject
    const defaultSubject = `Aviso de Cobrança — Parcela ${formatParcela(parcela)} do curso ${aluno.curso}`;
    setSubject(defaultSubject);

    let template = '';
    if (selectedRuleId) {
      const rule = regras.find(r => r.id === selectedRuleId);
      if (rule) {
        template = rule.mensagemTemplate;
      }
    } else {
      // Default fallback template if no rule is selected
      const defaultRule = regras.find(r => r.ativo && (canal === 'EMAIL' ? r.canal === 'EMAIL' || r.canal === 'AMBOS' : r.canal === 'WHATSAPP' || r.canal === 'AMBOS'));
      if (defaultRule) {
        setSelectedRuleId(defaultRule.id);
        template = defaultRule.mensagemTemplate;
      } else {
        template = 'Olá, {nome_aluno}. Lembramos que a parcela {parcela} do curso {curso} no valor de {valor} vence in {vencimento}. Caso já tenha pago, desconsidere. Setor Financeiro.';
      }
    }

    setMessageText(buildText(template, aluno, parcela));
  }, [selectedRuleId, canal, aluno, parcela, regras, isOpen]);

  if (!isOpen || !aluno || !parcela) return null;

  const handleSend = () => {
    if (!messageText.trim()) return;
    const rule = selectedRuleId ? regras.find(r => r.id === selectedRuleId) : null;
    const dest = rule ? rule.destinatario : 'ALUNO';
    onConfirm(canal, messageText, canal === 'EMAIL' ? subject : undefined, dest);
    onClose();
  };

  // Validations
  const hasValidEmail = aluno.email && aluno.email.includes('@');
  const hasValidPhone = aluno.whatsapp && aluno.whatsapp.trim().length > 5;
  const isSmtpActive = smtpConfig && smtpConfig.active;

  const canSend = canal === 'WHATSAPP' 
    ? hasValidPhone 
    : (hasValidEmail && isSmtpActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-400" />
              Customizar e Enviar Cobrança
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Revise a mensagem antes do envio manual
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Student & Installment Card Summary */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Aluno</p>
              <h3 className="text-sm font-semibold text-slate-950 mt-0.5">{aluno.nome}</h3>
              <p className="text-xs text-slate-500 font-sans mt-1">
                E-mail: <span className="font-mono text-slate-600">{aluno.email || 'Não informado'}</span>
              </p>
              <p className="text-xs text-slate-500 font-sans">
                WhatsApp: <span className="font-mono text-slate-600">{aluno.whatsapp || 'Não informado'}</span>
              </p>
            </div>
            <div className="md:text-right md:border-l md:border-slate-200 md:pl-4 flex-shrink-0">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Parcela</p>
              <p className="text-sm font-semibold text-slate-950 mt-0.5">
                {formatParcela(parcela)} ({aluno.curso})
              </p>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Valor: <span className="font-semibold text-indigo-600">R$ {parcela.valorAtual.toFixed(2)}</span>
              </p>
              <p className="text-xs text-slate-500 font-sans">
                Vencimento: <span className="font-medium text-slate-700">{parcela.vencimento}</span>
              </p>
            </div>
          </div>

          {/* Channel Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Selecione o Canal de Envio
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setCanal('WHATSAPP')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-sm font-semibold transition-all ${
                  canal === 'WHATSAPP'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <span>Enviar via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setCanal('EMAIL')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-semibold transition-all ${
                  !isSmtpActive 
                    ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' 
                    : canal === 'EMAIL'
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
                disabled={!isSmtpActive}
                title={!isSmtpActive ? 'SMTP Zoho Zeptomail não está configurado ou ativo.' : 'Enviar por E-mail'}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <span>Enviar via E-mail</span>
                </div>
                {!isSmtpActive && (
                  <span className="text-[10px] font-normal font-sans text-slate-400 mt-0.5">
                    SMTP Desativado
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Template Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Selecione a Régua / Template</span>
              <span className="text-[10px] text-slate-400 font-sans font-normal flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Carrega tokens dinâmicos
              </span>
            </label>
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-slate-400 focus:ring-slate-400"
            >
              {regras.map(rule => (
                <option key={rule.id} value={rule.id}>
                  {rule.titulo} ({rule.tipoGatilho} {Math.abs(rule.diasGatilho)} dias) {rule.ativo ? '🟢 Ativo' : '🔴 Inativo'}
                </option>
              ))}
              <option value="">-- Texto em Branco / Personalizado --</option>
            </select>
          </div>

          {/* Subject Field for Email */}
          {canal === 'EMAIL' && (
            <div className="animate-slide-down">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Assunto do E-mail (Subject)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Insira o assunto do e-mail..."
                className="w-full text-sm rounded-xl border-slate-200 shadow-sm focus:border-slate-400 focus:ring-slate-400"
              />
            </div>
          )}

          {/* Text Editor Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Mensagem a ser enviada
            </label>
            <textarea
              rows={6}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full text-sm font-sans rounded-xl border-slate-200 shadow-sm focus:border-slate-400 focus:ring-slate-400 p-3"
              placeholder="Digite sua mensagem de cobrança..."
            />
            <p className="text-[10px] text-slate-400 font-sans mt-1">
              Você pode editar livremente a mensagem acima. As variáveis já foram substituídas pelos valores do aluno.
            </p>
          </div>

          {/* Warning Messages */}
          {!canSend && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 flex gap-2.5 items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs font-sans">
                <p className="font-semibold">Não é possível realizar o envio</p>
                {canal === 'WHATSAPP' && !hasValidPhone && (
                  <p className="mt-0.5">O aluno não possui um número de WhatsApp válido cadastrado.</p>
                )}
                {canal === 'EMAIL' && !hasValidEmail && (
                  <p className="mt-0.5">O aluno não possui um endereço de e-mail válido cadastrado.</p>
                )}
                {canal === 'EMAIL' && hasValidEmail && !isSmtpActive && (
                  <p className="mt-0.5">A integração SMTP Zoho Zeptomail está desativada. Ative nas configurações.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-3">
          <div className="text-xs text-slate-500 font-sans hidden sm:flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            Esta ação criará um registro de cobrança no histórico da parcela.
          </div>
          
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={handleSend}
              className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all flex items-center gap-2 ${
                !canSend
                  ? 'bg-slate-300 cursor-not-allowed'
                  : canal === 'WHATSAPP'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Enviar Cobrança</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
