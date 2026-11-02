import { Navigate } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentSettings } from "./parent-settings";

export function ParentSettingsPage() {
  return useIsCompact() ? <Navigate to={ROUTES.parent.dashboard} replace /> : <ParentSettings />;
}
