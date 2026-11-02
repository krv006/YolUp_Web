import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentChildrenLegacy } from "./parent-children-legacy";
import { ParentFamily } from "./parent-family";

export function ParentChildrenPage() {
  return useIsCompact() ? <ParentChildrenLegacy /> : <ParentFamily />;
}
