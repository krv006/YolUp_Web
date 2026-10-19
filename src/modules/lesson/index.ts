export { lessonApi } from "./api/lesson.api";
export type {
  LessonDto,
  LessonFormInput,
  LessonRateRequestDto,
  LessonRatingDto,
  LessonRatingInput,
  LessonRecordingDto,
  LessonRequestDto,
} from "./api/lesson.dto";
export {
  mapLessonDto,
  mapLessonPage,
  mapLessonRatingDto,
  mapLessonRatingList,
  mapLessonRatingRequest,
  mapLessonRecordingDto,
  mapLessonRequest,
} from "./lib/lesson.mappers";
export {
  lessonKeys,
  useLesson,
  useLessons,
  useLessonPage,
  useLessonRatings,
  useLessonRecording,
  useLiveLesson,
  useLiveLessons,
  useCreateLesson,
  useCreateLessonSchedule,
  useDeleteLesson,
  useDeleteRecording,
  useFinishLesson,
  useRateLesson,
  useUpdateLesson,
} from "./model/lesson.queries";
export { useLessonView, useLessonViewStore } from "./model/lesson-view.store";
export { useTeacherAudioRecording } from "./model/use-teacher-audio-recording";
export type {
  TeacherAudioRecordingPhase,
  TeacherAudioRecordingSnapshot,
} from "./lib/teacher-audio-recording";
export { useTeacherVideoRecording } from "./model/use-teacher-video-recording";
export type {
  TeacherVideoRecordingPhase,
  TeacherVideoRecordingSnapshot,
} from "./lib/teacher-video-recording";
export type { LessonView } from "./model/lesson-view.store";
export {
  buildMonthGrid,
  formatDayTitle,
  formatMonthTitle,
  groupLessonsByDay,
  resolveInitialMonth,
  toDayKey,
} from "./lib/lesson-calendar";
export type { CalendarDay } from "./lib/lesson-calendar";
export {
  CLOSED_LESSON_STATUSES,
  isLessonClosed,
  useLessonStatusMeta,
} from "./lib/lesson-status";
export {
  addMinutesToTime,
  buildScheduleDates,
  EVEN_WEEKDAYS,
  findScheduleConflicts,
  findScheduleConflictsForDates,
  MAX_SCHEDULE_LESSONS,
  MAX_SCHEDULE_WEEKS,
  ODD_WEEKDAYS,
  toBackendWeekdays,
  WEEKDAYS,
  weeksBetween,
} from "./lib/lesson-schedule";
export type { ConflictQuery, ScheduleInput, Weekday } from "./lib/lesson-schedule";
export type { LessonStatusMeta } from "./lib/lesson-status";
export { FinishLessonDialog } from "./ui/finish-lesson-dialog";
export { LessonActions } from "./ui/lesson-actions";
export { LessonCalendar } from "./ui/lesson-calendar";
export { LessonList } from "./ui/lesson-list";
export { LessonRatingForm } from "./ui/lesson-rating-form";
export type { LessonRatingFormProps } from "./ui/lesson-rating-form";
export { LessonRatingsDialog } from "./ui/lesson-ratings-dialog";
export { LiveLessonBar } from "./ui/live-lesson-bar";
export { LessonRecordingPlayer } from "./ui/lesson-recording-player";
export { LessonViewSwitch } from "./ui/lesson-view-switch";
export { RateLessonDialog } from "./ui/rate-lesson-dialog";
export { LessonDetailDialog } from "./ui/lesson-detail-dialog";
export { LessonCreateDialog } from "./ui/lesson-create-dialog";
export {
  ScheduleDay,
  ScheduleEmpty,
  ScheduleMonth,
  ScheduleSkeleton,
  ScheduleWeek,
} from "./ui/schedule-grid";
export { ScheduleSidebar } from "./ui/schedule-sidebar";
export { useScheduleStore } from "./model/schedule.store";
export type { ScheduleView } from "./model/schedule.store";
export { RatingSummary, StarRating } from "./ui/star-rating";
