import { useIsCompact } from "@/shared/hooks/use-media-query";
import { FamilyMobile } from "./family-mobile";
import { ParentFamily } from "./parent-family";

export function ParentChildrenPage() {
  return useIsCompact() ? <FamilyMobile /> : <ParentFamily />;
}
