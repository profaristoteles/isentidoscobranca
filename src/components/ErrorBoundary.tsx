import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: Readonly<ErrorBoundaryProps>;

  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Sentidos Cobranças] Falha crítica no frontend:', error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <section className="max-w-xl w-full rounded-lg border border-red-400/30 bg-white/10 p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-red-300">Erro ao iniciar o sistema</p>
          <h1 className="mt-3 text-2xl font-bold">O painel encontrou uma falha no navegador.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            Atualize a página. Se continuar, limpe os dados do site no navegador ou envie esta mensagem para o suporte.
          </p>
          <pre className="mt-4 max-h-48 overflow-auto rounded bg-black/40 p-3 text-xs text-red-100">
            {this.state.error.message}
          </pre>
          <button
            className="mt-5 rounded bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </section>
      </main>
    );
  }
}
