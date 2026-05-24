import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Globe, 
  Zap, 
  Wifi,
  Bookmark
} from 'lucide-react';

interface TopbarProps {
  currentTab: string;
  onSearch?: (query: string) => void;
  crmSynced: boolean;
  whatsappOnline: boolean;
  selectedStudentName?: string | null;
  onSelectStudentBack?: () => void;
  isUsingApi?: boolean;
}

export default function Topbar({ 
  currentTab, 
  crmSynced, 
  whatsappOnline,
  selectedStudentName,
  onSelectStudentBack,
  isUsingApi = false
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  // Translate tab name for display
  const getTabLabel = () => {
    switch(currentTab) {
      case 'dashboard': return 'Resumo Financeiro';
      case 'alunos': return selectedStudentName ? `Alunos / Detalhe do Aluno` : 'Gestão de Alunos';
      case 'boletos': return 'Cobranças / Lista de Boletos';
      case 'importações': return 'Importação de Boletos CNAB / PDF';
      case 'cobranças': return 'Parâmetros / Régua de Cobrança';
      case 'whatsapp': return 'Automação WhatsApp & Evolution API';
      case 'crm': return 'Integrações / LeadConnector pipeline';
      case 'configurações': return 'Configurações de Segurança e Aparência';
      default: return 'Sentidos Cobranças';
    }
  };

  const currentDateTimeString = '22 de Maio de 2026, 12:39';

  const mockAlerts = [
    { id: 1, title: 'Boleto Vencido', text: 'Camila Guimarães está há 15 dias atrasada.', time: 'Há 5m', read: false },
    { id: 2, title: 'Evolution API', text: 'Sincronização de QR Code restabelecida com sucesso.', time: 'Há 1h', read: true },
    { id: 3, title: 'LeadConnector', text: 'Tag "inadimplente-critico" gerou 3 novos gatilhos de CRM.', time: 'Há 4h', read: true }
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10 shadow-xs">
      {/* Left section: Breadcrumb and title */}
      <div className="flex items-center gap-3">
        {selectedStudentName && currentTab === 'alunos' && (
          <button 
            onClick={onSelectStudentBack}
            className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md hover:bg-gray-200 transition font-medium cursor-pointer"
          >
            &larr; Voltar à lista
          </button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">FAEPI / INSTITUTO SENTIDOS</span>
            <span className="h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="text-[10px] font-mono font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase leading-none">Produção</span>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 capitalize tracking-tight mt-0.5">
            {selectedStudentName && currentTab === 'alunos' ? selectedStudentName : getTabLabel()}
          </h2>
        </div>
      </div>

      {/* Right Section: Connected status badges & notifications */}
      <div className="flex items-center gap-4">
        {/* Status indicator: Database connection */}
        <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
          isUsingApi 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <Bookmark className={`h-3 w-3 ${isUsingApi ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className="font-semibold text-[10px]">BANCO: {isUsingApi ? 'CONECTADO (LOCAL)' : 'DESCONECTADO (L.S.)'}</span>
        </div>

        {/* Status indicator: Whatsapp connected */}
        <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
          whatsappOnline 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${whatsappOnline ? 'bg-emerald-600 animate-ping' : 'bg-amber-500'}`}></span>
          <span className="font-semibold text-[10px]">WhatApp: {whatsappOnline ? 'CONECTADO' : 'AGUARDANDO QR'}</span>
        </div>

        {/* Status indicator: CRM Linked */}
        <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
          crmSynced 
            ? 'bg-blue-50 text-[#03045e] border-blue-200' 
            : 'bg-gray-100 text-gray-500 border-gray-200'
        }`}>
          <Zap className="h-3 w-3 text-[#ff8000]" />
          <span className="font-semibold text-[10px] uppercase">CRM LeadConnector: ATIVO</span>
        </div>

        {/* Date tracker */}
        <div className="text-right hidden xl:block">
          <p className="text-[10px] text-gray-400 font-medium">Data Local do Servidor</p>
          <p className="text-xs font-semibold text-gray-700 font-mono">{currentDateTimeString}</p>
        </div>

        {/* Alerts and notifications button */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg relative cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff8000]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-2">
              <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center bg-[#03045e]/5">
                <span className="text-xs font-semibold text-[#03045e]">Notificações do Sistema</span>
                <span className="text-[9px] bg-[#ff8000] text-white font-bold px-1.5 py-0.5 rounded-full">1 não lida</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {mockAlerts.map(alert => (
                  <div key={alert.id} className="p-3 hover:bg-gray-50 transition flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        {!alert.read && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                        {alert.title}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium">{alert.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">{alert.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 text-center border-t border-gray-50">
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold"
                >
                  Marcar todas como lidas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
