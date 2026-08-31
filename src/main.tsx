import React, { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div id="error-boundary-screen" className="fixed inset-0 bg-[#0a1128] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 text-3xl">
            ⚽
          </div>
          <h1 className="text-2xl font-black tracking-wider uppercase mb-2 text-amber-400">
            Free Kick Legends
          </h1>
          <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            The game encountered an unexpected loading state. Click below to reload the match.
          </p>
          <button
            id="error-boundary-reload-btn"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black uppercase text-sm tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            Reload Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);



