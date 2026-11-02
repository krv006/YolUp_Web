import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentHomework } from "./parent-homework";
import { ParentHomeworkLegacy } from "./parent-homework-legacy";

export function ParentHomeworkPage() {
  return useIsCompact() ? <ParentHomeworkLegacy /> : <ParentHomework />;
}
