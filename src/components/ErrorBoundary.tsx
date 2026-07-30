import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  declare props: Props;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', background: '#111', color: '#fff', minHeight: '100vh' }}>
          <h1 style={{ color: '#ef4444', fontSize: '18px' }}>Runtime Error</h1>
          <pre style={{ marginTop: '16px', whiteSpace: 'pre-wrap', fontSize: '13px', color: '#f5f5f5' }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', fontSize: '11px', color: '#94a3b8' }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => { localStorage.removeItem('recura_active_session_v2'); window.location.reload(); }}
            style={{ marginTop: '24px', padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
          >
            Clear session & reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
