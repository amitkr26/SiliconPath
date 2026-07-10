"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Section-level error boundary. Wrap client subtrees that fetch data so a
 * single failing widget cannot blank the whole page (previously caused the
 * academy page to hang on an infinite spinner).
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-secondary">
            This section failed to load. Please refresh the page.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
