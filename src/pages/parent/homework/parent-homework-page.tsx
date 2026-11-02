import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentHomework } from "./parent-homework";
import { HomeworkMobile } from "./homework-mobile";

export function ParentHomeworkPage() {
  return useIsCompact() ? <HomeworkMobile /> : <ParentHomework />;
}
