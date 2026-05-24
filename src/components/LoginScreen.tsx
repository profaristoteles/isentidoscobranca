import React, { useState } from 'react';
import { GraduationCap, ShieldAlert, ArrowRight, Loader } from 'lucide-react';
import { safeSetItem } from '../utils/storage';

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
  appName: string;
}

export default function LoginScreen({ onLoginSuccess, appName }: LoginScreenProps) {
  const [email, setEmail] = useState('isentidosedu@gmail.com');
  const [password, setPassword] = useState('sentidos123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Por favor, informe suas credenciais de acesso.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data.success) {
        if (data.token) {
          safeSetItem('sentidos_auth_token', data.token);
        }
        onLoginSuccess(email);
      } else {
        setErrorMsg(data.message || 'Credenciais inválidas.');
      }
    } catch (err) {
      console.warn('[Sentidos Cobranças] Backend offline para login, realizando validação offline.', err);
      setIsLoading(false);
      
      // Offline fallback
      if (email === 'isentidosedu@gmail.com' && password === 'sentidos123') {
        onLoginSuccess(email);
      } else {
        setErrorMsg('Erro de rede / Servidor offline. Use as credenciais demo: isentidosedu@gmail.com / sentidos123.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#02021e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Dynamic Floating Glassmorphic Blobs */}
      <div className="absolute right-[-10%] top-[-10%] bg-[#ff8000]/15 h-[500px] w-[500px] rounded-full blur-[100px] animate-float-slow pointer-events-none" />
      <div className="absolute left-[-15%] bottom-[-15%] bg-[#03045e]/40 h-[600px] w-[600px] rounded-full blur-[120px] animate-float-delayed pointer-events-none" />

      {/* Grid Pattern overlay for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Core emblem */}
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-[#ff8000] via-orange-600 to-[#03045e] p-[1.5px] shadow-[0_0_30px_rgba(255,128,0,0.2)]">
          <div className="w-full h-full bg-[#02021e] rounded-[15px] flex items-center justify-center text-white">
            <GraduationCap className="h-8 w-8 text-[#ff8000]" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-orange-400 bg-clip-text text-transparent">
          {appName}
        </h2>
        <p className="mt-2 text-center text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
          <span>PORTAL DE COBRANÇAS</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff8000]" />
          <span>FAEPI &middot; SENTIDOS</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="backdrop-blur-lg bg-white/5 border border-white/10 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 relative overflow-hidden">
          {/* Glass reflection shine */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl p-3.5 text-xs mb-5 flex items-start gap-2.5 animate-pulse">
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Endereço de E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl placeholder-white/35 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-[#ff8000] focus:border-[#ff8000] focus:bg-white/10 transition duration-300 font-medium font-sans"
                  placeholder="nome@faepi.edu.br"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Senha Administrativa
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl placeholder-white/35 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-[#ff8000] focus:border-[#ff8000] focus:bg-white/10 transition duration-300 font-medium font-sans"
                  placeholder="Chave de acesso corporativa"
                />
              </div>
              <p className="mt-2 text-[10px] text-gray-400 leading-normal">
                Dica Avaliação: Use a senha <strong className="font-mono text-[#ff8000] text-xs bg-white/5 px-1.5 py-0.5 rounded border border-white/5">sentidos123</strong>
              </p>
            </div>

            {/* Remember and Forgot */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-[#ff8000] focus:ring-[#ff8000] border-white/10 bg-white/5 rounded cursor-pointer transition"
                />
                <label htmlFor="remember-me" className="ml-2 block text-gray-300 cursor-pointer font-medium hover:text-white transition">
                  Manter conectado
                </label>
              </div>

              <div className="text-right">
                <a 
                  href="#" 
                  className="font-bold text-[#ff8000] hover:text-orange-400 transition hover:underline" 
                  onClick={(e) => { e.preventDefault(); alert('Recuperação de login enviada para TI/FAEPI!'); }}
                >
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-white/10 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-[#ff8000] hover:from-[#ff8000] hover:to-orange-600 hover:scale-[1.02] active:scale-[0.98] focus:outline-hidden transition-all duration-300 cursor-pointer disabled:opacity-50 shadow-[0_4px_20px_rgba(255,128,0,0.25)]"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4.5 w-4.5 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Painel</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials trigger block */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-3 tracking-wider">Acesso Rápido de Demonstração</span>
            <button
              onClick={() => {
                setEmail('isentidosedu@gmail.com');
                setPassword('sentidos123');
                onLoginSuccess('isentidosedu@gmail.com');
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-orange-400 hover:text-orange-300 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 w-full hover:scale-[1.01] active:scale-[0.99] duration-300"
            >
              <span>Acessar como Financeiro FAEPI</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
