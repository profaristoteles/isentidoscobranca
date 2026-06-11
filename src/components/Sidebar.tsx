import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Sliders,
  MessageSquare,
  Cpu,
  Settings,
  GraduationCap,
  LogOut,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userEmail: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentTab, onTabChange, onLogout, userEmail, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'alunos', name: 'Alunos', icon: Users, badge: null },
    { id: 'parcelas', name: 'Parcelas', icon: FileText, badge: 'Financeiro' },
    { id: 'cobranças', name: 'Cobranças', icon: Sliders, badge: 'Régua' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, badge: 'API' },
    { id: 'crm', name: 'CRM Integration', icon: Cpu, badge: 'Active' },
    { id: 'configurações', name: 'Configurações', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" 
          onClick={onClose}
        />
      )}
      
      <aside className={`w-64 bg-[#03045e] text-white flex flex-col h-screen fixed top-0 left-0 z-30 shadow-2xl transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#03045e]/30 flex flex-col gap-1.5 justify-center relative">
          {/* Close button on mobile */}
          <button 
            className="absolute top-4 right-4 p-1 rounded-md text-blue-200 hover:text-white hover:bg-white/10 lg:hidden transition cursor-pointer"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-[#ff8000] to-orange-500 rounded-lg shadow-md animate-pulse">
              <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              SENTIDOS
            </h1>
            <span className="text-[10px] font-semibold tracking-wider text-orange-400">
              COBRANÇAS &middot; FAEPI
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all group duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-[#ff8000] text-white shadow-md font-semibold'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'
                }`} />
                <span>{item.name}</span>
              </div>
              
              {item.badge ? (
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
                  isActive 
                    ? 'bg-white/25 text-white' 
                    : item.id === 'whatsapp' || item.id === 'crm' 
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                      : 'bg-orange-500/25 text-orange-300 border border-orange-500/40'
                }`}>
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={`h-3 w-3 opacity-0 transition-all ${
                  isActive ? 'opacity-100 translate-x-0.5' : 'group-hover:opacity-60 group-hover:translate-x-0'
                }`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Account Meta */}
      <div className="p-4 border-t border-white/10 bg-[#020340]/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-orange-500/20 border border-[#ff8000]/40 flex items-center justify-center text-[#ff8000] font-bold text-sm">
            FS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Financeiro Sentidos</p>
            <p className="text-[10px] text-blue-200 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/40 border border-white/5 text-xs text-blue-200 font-medium rounded-md transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair da Sessão</span>
        </button>
      </div>
    </aside>
    </>
  );
}
