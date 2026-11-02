import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentExamsLegacy } from "./parent-exams-legacy";
import { ParentMock } from "./parent-mock";

export function ParentExamsPage() {
  return useIsCompact() ? <ParentExamsLegacy /> : <ParentMock />;
}
