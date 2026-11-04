import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logged locally only. Nothing is sent anywhere.
    console.error('Iron Will UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center text-ink">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-danger/15 text-danger">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">Your data is safe on this device. Reloading usually fixes this.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-accent px-6 font-semibold text-onaccent"
        >
          <RefreshCw className="h-4 w-4" /> Reload app
        </button>
      </div>
    );
  }
}
