import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentAttendance } from "./parent-attendance";
import { ParentAttendanceLegacy } from "./parent-attendance-legacy";

export function ParentAttendancePage() {
  return useIsCompact() ? <ParentAttendanceLegacy /> : <ParentAttendance />;
}
