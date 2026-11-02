import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentHome } from "./parent-home";
import { ParentHomeMobile } from "./parent-home-mobile";

export function ParentDashboardPage() {
  return useIsCompact() ? <ParentHomeMobile /> : <ParentHome />;
}
