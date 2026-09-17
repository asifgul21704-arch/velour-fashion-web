import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[VELOUR Uncaught Error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-white border border-neutral-200/80 p-8 md:p-10 shadow-sm space-y-6">
            <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-semibold block">
              Atelier Notice
            </span>
            <h1 className="font-serif text-3xl md:text-4xl text-neutral-900 leading-tight">
              Something went wrong.
            </h1>
            <p className="text-xs text-neutral-500 uppercase tracking-widest leading-relaxed">
              We encountered an unexpected issue while rendering this view. Please refresh or return to the main storefront.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Refresh View
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-6 py-3 border border-neutral-300 text-neutral-800 text-xs uppercase tracking-widest font-semibold hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
