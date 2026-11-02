import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ParentAttendance } from "./parent-attendance";
import { AttendanceMobile } from "./attendance-mobile";

export function ParentAttendancePage() {
  return useIsCompact() ? <AttendanceMobile /> : <ParentAttendance />;
}
