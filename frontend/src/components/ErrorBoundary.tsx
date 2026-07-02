import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// React only supports catching render-time errors via a class component's
// componentDidCatch/getDerivedStateFromError — there is still no hook
// equivalent as of React 19, so this is necessarily a class despite the
// rest of the app being fully functional-component based.
//
// Without this, any render-time exception anywhere in the tree — a bad API
// response shape, a null the UI didn't expect, a third-party library
// throwing — currently unmounts the entire app and leaves a blank white
// page with no way to recover short of the user guessing to hit refresh.
// This wraps the whole app (see main.tsx) so a crash anywhere shows a
// styled, on-brand fallback with a real recovery action instead.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[PRAHARI X] Unhandled render error:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[color:var(--color-base)] bg-grid px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--color-danger-500)]/12 text-[color:var(--color-danger-400)]">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div>
          <p className="mono-tag text-sm text-[color:var(--color-ink-3)]">SYSTEM FAULT</p>
          <h1 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink-0)]">Something went wrong</h1>
          <p className="mt-2 max-w-sm text-sm text-[color:var(--color-ink-3)]">
            PRAHARI X hit an unexpected error and couldn't continue rendering this view. Reloading usually resolves
            it — if it keeps happening, contact your system administrator.
          </p>
          <Button className="mt-6" onClick={this.handleReload}>
            Reload PRAHARI X
          </Button>
        </div>
      </div>
    );
  }
}
