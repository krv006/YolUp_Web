import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ResultsMobile } from "./results-mobile";
import { ParentResults } from "./parent-results";

export function ParentReportPage() {
  return useIsCompact() ? <ResultsMobile /> : <ParentResults />;
}
