import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { env } from "@/shared/config";
import { i18n } from "@/shared/i18n";
import { Icon } from "@/shared/ui/icon";
import { RouteStatus, routeStatusButton, routeStatusGhostButton } from "@/shared/ui/route-status";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const CHUNK_LOAD_ERROR =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Failed to load module script|Importing a module script failed/i;
const CHUNK_RELOAD_FLAG = "chunk-reload-attempted";

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidMount(): void {
    if (!this.state.error) sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (!env.isProduction) console.error("Route render error", error, errorInfo);

    if (CHUNK_LOAD_ERROR.test(error.message) && !sessionStorage.getItem(CHUNK_RELOAD_FLAG)) {
      sessionStorage.setItem(CHUNK_RELOAD_FLAG, "1");
      window.location.reload();
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <RouteStatus
        tone="error"
        icon={<Icon name="error" size={28} />}
        mobileIcon={<Icon name="warning-fill" size={48} />}
        title={i18n.t("common:routeState.errorTitle")}
        description={i18n.t("common:routeState.errorDescription")}
        action={
          <>
            <button
              type="button"
              className={routeStatusGhostButton}
              onClick={() => window.open("https://t.me/yolup_support", "_blank", "noopener")}
            >
              {i18n.t("common:routeState.help")}
            </button>
            <button
              type="button"
              className={routeStatusButton}
              onClick={() => window.location.reload()}
            >
              {i18n.t("common:routeState.errorAction")}
            </button>
          </>
        }
      />
    );
  }
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <ErrorBoundary key={location.key}>{children}</ErrorBoundary>;
}
