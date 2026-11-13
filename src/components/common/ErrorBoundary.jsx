import React from 'react';
import { AlertTriangle, RefreshCw, Sparkles, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Elaris HRMS Runtime Error Boundary Caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clear notice:', e);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#2D3250] p-4 sm:p-6 lg:p-8 text-white">
          <div className="relative w-full max-w-lg rounded-3xl bg-white text-[#2D3250] shadow-2xl overflow-hidden border border-gray-100 p-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4 shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h1 className="text-2xl font-black text-[#2D3250] tracking-tight">
              Elaris<span className="text-[#FFB17A]">Solutions</span>
            </h1>
            <p className="text-xs uppercase tracking-wider text-[#676F9D] font-bold mt-1">
              Application Recovery Mode
            </p>

            <div className="my-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-left text-xs text-gray-700 space-y-2">
              <p className="font-semibold text-[#2D3250]">
                An unexpected interface error occurred during execution.
              </p>
              <p className="text-gray-500">
                {this.state.error?.message || 'A script error prevented this view from rendering completely.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D3250] hover:bg-[#424769] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-[#424769] text-xs font-semibold transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Reset & Restart
              </button>
            </div>

            {this.state.error && (
              <details className="mt-6 text-left border-t border-gray-100 pt-4">
                <summary className="text-[11px] text-[#676F9D] font-mono cursor-pointer hover:underline">
                  View Technical Stack
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-gray-900 text-gray-200 text-[10px] overflow-x-auto max-h-40 font-mono whitespace-pre-wrap">
                  {this.state.error.stack || this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

