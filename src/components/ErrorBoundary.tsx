import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">অ্যাপ লোড হতে সমস্যা হয়েছে</h2>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            পৃষ্ঠাটি রিফ্রেশ করুন অথবা আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।
          </p>
          {this.state.error && (
            <pre className="text-[10px] text-rose-400 bg-slate-900 border border-slate-800 p-2.5 rounded-xl max-w-sm overflow-x-auto text-left mb-4">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>আবার চেষ্টা করুন</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
