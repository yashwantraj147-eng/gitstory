"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || "Unexpected rendering error",
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-950/20 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-white">
            {this.props.fallbackTitle || "Section failed to render"}
          </h4>
          {this.state.errorMessage && (
            <p className="text-xs text-slate-400 max-w-md mx-auto">{this.state.errorMessage}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, errorMessage: null })}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Section</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
