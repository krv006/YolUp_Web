export { parentApi } from "./api/parent.api";
export type {
  Consent,
  ConsentDto,
  ConsentKind,
  LinkStatus,
  ParentChild,
  ParentDashboard,
  ParentLink,
  ParentLinkDto,
  SetConsentInput,
} from "./api/parent.dto";
export { createParentDashboard, mapChildFromLink, mapParentLinkDto } from "./lib/parent.mappers";
export {
  parentKeys,
  useParentDashboard,
  useParentChildren,
  useParentHomework,
  useParentLinks,
  useParentConsents,
  useRequestChildLink,
  useCreateChild,
  useRespondParentLink,
  useSetParentConsent,
} from "./model/parent.queries";
export { useSelectedChild, useSelectedChildStore } from "./model/selected-child.store";
export type { UseSelectedChildResult } from "./model/selected-child.store";
export { SelectedChildSelector } from "./ui/selected-child-selector";
export { LinkChildDialog } from "./ui/link-child-dialog";
export { CreateChildDialog } from "./ui/create-child-dialog";
export { AddChildDialog } from "./ui/add-child-dialog";
export * as parentHome from "./lib/parent-home";
export type { AttentionItem, HeroState, LessonOutcome, WeekSummary } from "./lib/parent-home";
export * as parentFamily from "./lib/parent-family";
export type { ChildPeriodSummary, CourseSchedule, FamilyPeriod } from "./lib/parent-family";
export * as parentAttendance from "./lib/parent-attendance";
export type { AttendanceEntry, AttendancePeriod, AttendanceStats, AttendanceStatus } from "./lib/parent-attendance";
export { printTable } from "./lib/print-table";
export { downloadFile } from "./lib/download-file";
