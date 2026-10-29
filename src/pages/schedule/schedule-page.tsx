import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  addDays,
  addMonths,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useAttendance } from "@/modules/attendance";
import { useCurrentUser, useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations, useGroupImages } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import {
  RateLessonDialog,
  buildScheduleDates,
  useCancelLesson,
  useCreateLesson,
  useCreateLessonSchedule,
  useLessonReminder,
  useLessons,
} from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { useOnlineStatus } from "@/shared/model";
import { Icon } from "@/shared/ui/icon";
import type { Lesson } from "@/shared/types";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { monthAttendanceRate } from "@/pages/student/lib/attendance-rate";
import { LessonDetailDrawer } from "./lesson-detail-drawer";
import { LessonRatingsDialog } from "./lesson-ratings-dialog";
import { MobileSchedule, type MobileScheduleView } from "./mobile-schedule";
import { ScheduleError, ScheduleListSkeleton } from "./schedule-states";
import { NewLessonDialog, type NewLessonValues } from "./new-lesson-dialog";
import { ScheduleDay } from "./schedule-day";
import { ScheduleList } from "./schedule-list";
import { ScheduleMonth } from "./schedule-month";
import { ScheduleWeek } from "./schedule-week";

type View = "day" | "week" | "month" | "list";

const VIEWS: View[] = ["day", "week", "month", "list"];

export function SchedulePage() {
  const { t } = useTranslation("lesson");
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const student = useIsStudent();
  const routes = useRoleRoutes();
  const me = useCurrentUser();
  const lessons = useLessons({ page_size: 200 });
  const courses = useCourses();
  const conversations = useConversations(student ? "student" : "teacher");
  const groupImages = useGroupImages(student ? "student" : "teacher");
  const attendance = useAttendance({ page_size: 200 }, student);
  const createLesson = useCreateLesson();
  const createSchedule = useCreateLessonSchedule();
  const cancelLesson = useCancelLesson();
  const reminder = useLessonReminder();

  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [now] = useState(() => new Date());
  const [detail, setDetail] = useState<Lesson | null>(null);
  const [ratingsOf, setRatingsOf] = useState<Lesson | null>(null);
  const [rateTarget, setRateTarget] = useState<Lesson | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const isCompact = useIsCompact();
  const [mobileView, setMobileView] = useState<MobileScheduleView>("day");

  const months = t("list.monthsLong", { returnObjects: true }) as string[];
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];

  const items = useMemo(() => lessons.data ?? [], [lessons.data]);
  const detailLesson = detail ? (items.find((item) => item.id === detail.id) ?? detail) : null;

  function toggleReminder(lesson: Lesson) {
    const enabled = !lesson.hasReminder;
    reminder.mutate(
      { id: lesson.id, enabled },
      {
        onSuccess: (minutes) =>
          toast.success(enabled ? t("schedule.reminderSet", { count: minutes ?? 15 }) : t("schedule.reminderCleared")),
      }
    );
  }

  const courseLook = useMemo(() => {
    const byId = new Map((courses.data ?? []).map((course) => [course.id, course]));
    return (courseId: string) => {
      const course = byId.get(courseId);
      return {
        tone: course?.color,
        image: course?.avatarUrl ?? groupImages.get(courseId) ?? null,
        students: course?.studentCount ?? 0,
        teacher: course?.teacher ?? "",
      };
    };
  }, [courses.data, groupImages]);

  const roomByCourse = useMemo(
    () =>
      new Map(
        (conversations.data ?? [])
          .filter((item) => item.courseId)
          .map((item) => [item.courseId as string, item.id])
      ),
    [conversations.data]
  );

  const visible = useMemo(() => {
    return items.filter((lesson) => {
      const date = new Date(lesson.startsAt);
      if (view === "day") return isSameDay(date, anchor);
      if (view === "week" || view === "list")
        return isWithinInterval(date, {
          start: startOfWeek(anchor, { weekStartsOn: 1 }),
          end: endOfWeek(anchor, { weekStartsOn: 1 }),
        });
      return isSameMonth(date, anchor);
    });
  }, [items, view, anchor]);

  const attendanceRate = useMemo(
    () => (student ? monthAttendanceRate(items, attendance.data ?? [], now) : null),
    [student, items, attendance.data, now]
  );

  const rangeLabel = useMemo(() => {
    if (view === "day") {
      return `${weekdaysLong[(anchor.getDay() + 6) % 7] ?? ""}, ${anchor.getDate()}-${(
        months[anchor.getMonth()] ?? ""
      ).toLowerCase()}`;
    }
    if (view === "month") {
      return `${months[anchor.getMonth()] ?? ""} ${anchor.getFullYear()}`;
    }
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    const end = endOfWeek(anchor, { weekStartsOn: 1 });
    const startMonth = start.getMonth() === end.getMonth() ? "" : ` ${(months[start.getMonth()] ?? "").toLowerCase()}`;
    return `${start.getDate()}${startMonth} – ${end.getDate()} ${(months[end.getMonth()] ?? "").toLowerCase()}, ${end.getFullYear()}`;
  }, [view, anchor, months, weekdaysLong]);

  function step(direction: number) {
    if (view === "month") {
      setAnchor((current) => addMonths(current, direction));
      return;
    }
    setAnchor((current) => addDays(current, view === "day" ? direction : direction * 7));
  }

  function createFromDialog(values: NewLessonValues) {
    if (!values.repeatWeeks) return createLesson.mutateAsync(values).then(() => setCreateOpen(false));
    const first = new Date(`${values.date}T00:00`);
    const endsOn = addDays(first, values.repeatWeeks * 7 - 1);
    const range = {
      startsOn: values.date,
      endsOn: `${endsOn.getFullYear()}-${String(endsOn.getMonth() + 1).padStart(2, "0")}-${String(endsOn.getDate()).padStart(2, "0")}`,
      weekdays: [first.getDay() === 0 ? 7 : first.getDay()],
    };
    return createSchedule
      .mutateAsync({
        courseId: values.courseId,
        title: values.topic,
        time: values.time,
        durationMinutes: Number(values.duration) || 45,
        ...range,
        dates: buildScheduleDates(range),
      })
      .then(() => setCreateOpen(false));
  }

  function openChat(lesson: Lesson) {
    const room = roomByCourse.get(lesson.courseId);
    navigate(room ? routes.chat(room) : routes.chats);
  }

  const joinLesson = (lesson: Lesson) => navigate(ROUTES.live(lesson.id));

  const dialogs = (
    <>
      <LessonDetailDrawer
        lesson={detailLesson}
        studentCount={detail ? courseLook(detail.courseId).students : 0}
        now={now}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        onChat={(lesson) => {
          setDetail(null);
          openChat(lesson);
        }}
        onJoin={joinLesson}
        student={student}
        teacherName={detail ? courseLook(detail.courseId).teacher : ""}
        onRemind={toggleReminder}
        onRecording={(lesson) => navigate(ROUTES.student.recording(lesson.id))}
        onRate={(lesson) => {
          setDetail(null);
          setRateTarget(lesson);
        }}
        onRatings={(lesson) => {
          setDetail(null);
          setRatingsOf(lesson);
        }}
        onCancel={(lesson) => {
          cancelLesson.mutate({ id: lesson.id, scope: "one" });
          setDetail(null);
        }}
      />

      <LessonRatingsDialog
        lesson={ratingsOf}
        onOpenChange={(open) => {
          if (!open) setRatingsOf(null);
        }}
      />

      {student ? (
        <RateLessonDialog
          lesson={rateTarget}
          currentUserId={me?.id}
          onOpenChange={(open) => {
            if (!open) setRateTarget(null);
          }}
        />
      ) : (
      <NewLessonDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        courses={(courses.data ?? []).map((course) => ({
          id: course.id,
          title: course.title,
          studentCount: course.studentCount ?? 0,
          tone: course.color,
          image: course.avatarUrl ?? groupImages.get(course.id) ?? null,
        }))}
        pending={createLesson.isPending || createSchedule.isPending}
        onSubmit={createFromDialog}
      />
      )}
    </>
  );

  if (isCompact)
    return (
      <>
        <MobileSchedule
          view={mobileView}
          anchor={anchor}
          now={now}
          online={online}
          loading={lessons.isLoading}
          error={lessons.isError}
          onRetry={() => void lessons.refetch()}
          lessons={items}
          courseLook={courseLook}
          onView={setMobileView}
          onAnchor={setAnchor}
          onSelect={setDetail}
          onChat={openChat}
          onJoin={joinLesson}
          student={student}
          onCreate={student ? undefined : () => setCreateOpen(true)}
        />
        {dialogs}
      </>
    );

  return (
    <WorkspaceShell
      eyebrow={
        lessons.isLoading
          ? `${rangeLabel} · ${t("scheduleState.loading")}`
          : lessons.isError
            ? rangeLabel
            : `${rangeLabel} · ${t("schedule.lessonCount", { count: visible.length })}`
      }
      title={t("schedule.title")}
    >
      <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle"
            aria-label={t("schedule.prev")}
            onClick={() => step(-1)}
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <button
            type="button"
            className="flex h-9 items-center rounded-full px-3 text-button text-ink transition-colors hover:bg-surface"
            onClick={() => setAnchor(new Date())}
          >
            {view === "month" ? months[anchor.getMonth()] : t("schedule.today")}
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle"
            aria-label={t("schedule.next")}
            onClick={() => step(1)}
          >
            <Icon name="chevron-right" size={18} />
          </button>
        </div>

        <span className="min-w-0 flex-1" />

        <div className="flex h-10 items-center rounded-full border border-line bg-surface p-[3px]">
          {VIEWS.map((item) => (
            <button
              key={item}
              type="button"
              className={`flex h-8 items-center rounded-full px-[17px] text-body-xs font-semibold transition-colors ${
                view === item ? "bg-brand text-ink-inverse" : "text-ink hover:text-brand"
              }`}
              onClick={() => setView(item)}
            >
              {t(`schedule.views.${item}`)}
            </button>
          ))}
        </div>

        {student ? null : (
          <button
            type="button"
            className={
              lessons.isError
                ? "flex h-[42px] shrink-0 items-center rounded-full bg-brand-subtle px-[15px] text-label-lg font-semibold text-brand-strong"
                : "flex h-[42px] shrink-0 items-center rounded-full bg-brand px-[15px] text-label-lg font-semibold whitespace-nowrap text-ink-inverse transition-colors hover:bg-brand-strong"
            }
            onClick={() => setCreateOpen(true)}
          >
            {t("schedule.create")}
          </button>
        )}
      </div>

      {!online ? (
        <p className="flex items-center gap-3 rounded-lg bg-surface-inverse px-5 py-4 text-body-sm text-ink-inverse">
          <Icon name="wifi" size={20} className="shrink-0" />
          {t("schedule.offline")}
        </p>
      ) : null}

      {lessons.isLoading ? <ScheduleListSkeleton /> : null}
      {lessons.isError ? <ScheduleError onRetry={() => void lessons.refetch()} /> : null}

      {lessons.isLoading || lessons.isError ? null : view === "day" ? (
        <ScheduleDay
          anchor={anchor}
          lessons={visible}
          now={now}
          courseLook={courseLook}
          student={student}
          attendanceRate={attendanceRate}
          onPickDay={setAnchor}
          onSelect={setDetail}
          onChat={openChat}
          onJoin={joinLesson}
        />
      ) : null}

      {!lessons.isLoading && !lessons.isError && view === "week" ? (
        <ScheduleWeek
          anchor={anchor}
          lessons={visible}
          now={now}
          onSelect={setDetail}
          onCreate={student ? undefined : () => setCreateOpen(true)}
        />
      ) : null}

      {!lessons.isLoading && !lessons.isError && view === "month" ? (
        <ScheduleMonth
          anchor={anchor}
          lessons={visible}
          onSelect={setDetail}
          onPickDay={(date) => {
            setAnchor(date);
            setView("day");
          }}
        />
      ) : null}

      {!lessons.isLoading && !lessons.isError && view === "list" ? (
        <ScheduleList
          lessons={visible}
          now={now}
          courseLook={courseLook}
          onSelect={setDetail}
          onJoin={joinLesson}
        />
      ) : null}
      </div>

      {dialogs}
    </WorkspaceShell>
  );
}
