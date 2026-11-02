import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentReportLegacy } from "./parent-report-legacy";
import { ParentResults } from "./parent-results";

export function ParentReportPage() {
  return useIsCompact() ? <ParentReportLegacy /> : <ParentResults />;
}
