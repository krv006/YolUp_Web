import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentMobileShell, ParentShell } from "@/widgets/parent-shell";

export function ParentLayout() {
  return useIsCompact() ? <ParentMobileShell /> : <ParentShell />;
}
