import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WorkSphere UI Error caught by boundary:', error, errorInfo);
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto flex items-center justify-center min-h-[50vh]">
          <Card className="p-6 border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">
              {this.props.fallbackTitle || 'Component Rendering Interrupted'}
            </h3>
            <p className="text-xs text-text-secondary mt-1 mb-4 leading-relaxed max-w-md">
              {this.state.error?.message ||
                'An unexpected error occurred while rendering this interface view. You can reload or return to the main dashboard.'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleRetry}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reload View
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
