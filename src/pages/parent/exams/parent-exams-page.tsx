import { useIsCompact } from "@/shared/hooks/use-media-query";
import { MockMobile } from "./mock-mobile";
import { ParentMock } from "./parent-mock";

export function ParentExamsPage() {
  return useIsCompact() ? <MockMobile /> : <ParentMock />;
}
