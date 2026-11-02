import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentDashboardLegacy } from "./parent-dashboard-legacy";
import { ParentHome } from "./parent-home";

export function ParentDashboardPage() {
  return useIsCompact() ? <ParentDashboardLegacy /> : <ParentHome />;
}
