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
import { useCurrentUser, useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations, useGroupImages } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import {
  CancelLessonDialog,
  LessonFormDialog,
  RateLessonDialog,
  useCreateLesson,
  useCreateLessonSchedule,
  useCreateLessonsBulk,
  useLessonReminder,
  useLessons,
  useScheduleQuizzes,
  useUpdateLesson,
  type LessonDraft,
  type LessonScheduleDraft,
} from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { useOnlineStatus } from "@/shared/model";
import { Icon } from "@/shared/ui/icon";
import type { Lesson } from "@/shared/types";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { monthAttendanceRate } from "@/pages/student/lib/attendance-rate";
import { LessonDetailDrawer } from "./lesson-detail-drawer";
import { isQuizEvent, quizEventId, quizEvents, scheduleRange } from "./quiz-events";
import { LessonRatingsDialog } from "./lesson-ratings-dialog";
import { MobileSchedule, type MobileScheduleView } from "./mobile-schedule";
import { ScheduleError, ScheduleListSkeleton } from "./schedule-states";
import { ScheduleDay } from "./schedule-day";
import { ScheduleMonth } from "./schedule-month";
import { ScheduleWeek } from "./schedule-week";

type View = "day" | "week" | "month";

const VIEWS: View[] = ["day", "week", "month"];

export function SchedulePage() {
  const { t } = useTranslation("lesson");
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const student = useIsStudent();
  const routes = useRoleRoutes();
  const me = useCurrentUser();
  const [anchor, setAnchor] = useState(() => new Date());
  const range = useMemo(() => scheduleRange(anchor), [anchor]);
  const lessons = useLessons({ starts_at__gte: range.from, starts_at__lte: range.to, ordering: "starts_at", page_size: 200 }, true, true);
  const courses = useCourses();
  const { t: tq } = useTranslation("quiz");
  const conversations = useConversations(student ? "student" : "teacher");
  const groupImages = useGroupImages(student ? "student" : "teacher");
  const createLesson = useCreateLesson();
  const createSchedule = useCreateLessonSchedule();
  const createBulk = useCreateLessonsBulk();
  const updateLesson = useUpdateLesson();
  const reminder = useLessonReminder();

  const [view, setView] = useState<View>("week");
  const [now] = useState(() => new Date());
  const [detail, setDetail] = useState<Lesson | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Lesson | null>(null);
  const [ratingsOf, setRatingsOf] = useState<Lesson | null>(null);
  const [rateTarget, setRateTarget] = useState<Lesson | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const allLessons = useLessons({ page_size: 200 }, createOpen);
  const isCompact = useIsCompact();
  const [mobileView, setMobileView] = useState<MobileScheduleView>("day");

  const quizzes = useScheduleQuizzes(range);

  const months = t("list.monthsLong", { returnObjects: true }) as string[];
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];

  const quizItems = useMemo(
    () =>
      quizEvents(quizzes.data ?? [], {
        courseTitle: (courseId) => (courses.data ?? []).find((course) => course.id === courseId)?.title ?? "",
        label: (title) => tq("schedule.testLabel", { title }),
        now,
      }),
    [quizzes.data, courses.data, tq, now]
  );
  const items = useMemo(() => [...(lessons.data ?? []), ...quizItems], [lessons.data, quizItems]);

  function select(lesson: Lesson) {
    if (!isQuizEvent(lesson)) return setDetail(lesson);
    const quizId = quizEventId(lesson);
    navigate(student ? ROUTES.student.test(quizId) : ROUTES.teacher.testView(quizId));
  }
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
      if (view === "week")
        return isWithinInterval(date, {
          start: startOfWeek(anchor, { weekStartsOn: 1 }),
          end: endOfWeek(anchor, { weekStartsOn: 1 }),
        });
      return isSameMonth(date, anchor);
    });
  }, [items, view, anchor]);

  const attendanceRate = useMemo(
    () => (student ? monthAttendanceRate(items, now) : null),
    [student, items, now]
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

  function closeLessonForm() {
    setCreateOpen(false);
    setEditing(null);
  }

  function saveLesson(values: LessonDraft & { courseId: string }) {
    const request = editing
      ? updateLesson.mutateAsync({ id: editing.id, form: values })
      : createLesson.mutateAsync(values);
    return request.then(closeLessonForm);
  }

  function saveSchedule(draft: LessonScheduleDraft) {
    return createSchedule
      .mutateAsync({
        courseId: draft.courseId,
        title: draft.topic,
        time: draft.time,
        durationMinutes: Number(draft.duration) || 90,
        weekdays: draft.weekdays,
        startsOn: draft.startsOn,
        endsOn: draft.endsOn,
        dates: draft.dates,
      })
      .then(closeLessonForm);
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
        onEdit={(lesson) => {
          setDetail(null);
          setEditing(lesson);
          setCreateOpen(true);
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
          setDetail(null);
          setCancelTarget(lesson);
        }}
      />
      <CancelLessonDialog
        lesson={cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
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
      <LessonFormDialog
        key={editing?.id ?? "new-lesson"}
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) closeLessonForm();
          else setCreateOpen(true);
        }}
        courses={(courses.data ?? []).map((course) => ({
          id: course.id,
          title: course.title,
          studentCount: course.studentCount ?? 0,
          tone: course.color,
          image: course.avatarUrl ?? groupImages.get(course.id) ?? null,
        }))}
        initialValues={editing}
        existingLessons={allLessons.data ?? []}
        onCreate={saveLesson}
        onCreateSchedule={saveSchedule}
        onCreateBulk={(rows, courseId) => createBulk.mutateAsync({ courseId, rows }).then(closeLessonForm)}
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
          onSelect={select}
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
            : `${rangeLabel} · ${t("schedule.lessonCount", { count: visible.filter((item) => !isQuizEvent(item)).length })}`
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
          onSelect={select}
          onChat={openChat}
          onJoin={joinLesson}
        />
      ) : null}

      {!lessons.isLoading && !lessons.isError && view === "week" ? (
        <ScheduleWeek
          anchor={anchor}
          lessons={visible}
          now={now}
          onSelect={select}
        />
      ) : null}

      {!lessons.isLoading && !lessons.isError && view === "month" ? (
        <ScheduleMonth
          anchor={anchor}
          lessons={visible}
          onSelect={select}
          onPickDay={(date) => {
            setAnchor(date);
            setView("day");
          }}
        />
      ) : null}

      </div>

      {dialogs}
    </WorkspaceShell>
  );
}
