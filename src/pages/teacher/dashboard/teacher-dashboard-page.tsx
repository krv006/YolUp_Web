import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useDashboardActivity, useMyAnalytics, useTeacherDashboard } from "@/modules/analytics";
import { useConversations } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import { useLessons } from "@/modules/lesson";
import { useLessonPresence } from "@/modules/live";
import { NotificationBell } from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { useOnline } from "@/shared/hooks/use-online";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { GlobalSearchDialog } from "@/widgets/global-search";
import { DashboardHero } from "./dashboard-hero";
import { DashboardEmptyGroups } from "./dashboard-empty-groups";
import { DashboardSkeleton } from "./dashboard-skeleton";

const LESSON_PAGE_SIZE = 60;

function isToday(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function clock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function endClock(startsAt: string, durationMinutes: number): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "—";
  return clock(new Date(date.getTime() + (durationMinutes || 45) * 60000).toISOString());
}

export function TeacherDashboardPage() {
  const { t } = useTranslation("dashboard");
  const months = t("months", { returnObjects: true }) as string[];
  const weekdays = useTranslation("lesson").t("list.weekdaysLong", {
    returnObjects: true,
  }) as string[];
  const navigate = useNavigate();
  const { user } = useAuth();
  const online = useOnline();
  const courses = useCourses();
  const lessons = useLessons({ page_size: LESSON_PAGE_SIZE });
  const stats = useMyAnalytics();
  const dashboard = useTeacherDashboard();
  const activity = useDashboardActivity(10);
  const conversations = useConversations("teacher");
  const [searchOpen, setSearchOpen] = useState(false);
  const [today] = useState(() => new Date());

  const groups = useMemo(() => courses.data ?? [], [courses.data]);

  const assignmentQueries = useQueries({
    queries: groups.map((course) => ({
      queryKey: homeworkKeys.assignments(course.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        homeworkApi.getAssignments(course.id, { signal }),
    })),
  });

  const assignments = useMemo(
    () => assignmentQueries.flatMap((query) => query.data ?? []),
    [assignmentQueries]
  );

  const todayLessons = useMemo(
    () =>
      (lessons.data ?? [])
        .filter((lesson) => isToday(lesson.startsAt) && lesson.status !== "cancelled")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [lessons.data]
  );

  const liveLesson = todayLessons.find((lesson) => lesson.status === "live") ?? null;
  const presence = useLessonPresence(liveLesson?.id, Boolean(liveLesson));
  const nextLesson = todayLessons.find((lesson) => lesson.status === "scheduled") ?? null;
  const heroLesson = liveLesson ?? nextLesson;
  const finishedCount = todayLessons.filter((lesson) => lesson.status === "finished").length;

  const toReview = useMemo(
    () =>
      assignments
        .filter((item) => item.status !== "draft")
        .map((item) => ({
          assignment: item,
          pending: item.submissions.filter((entry) => !entry.grade).length,
        }))
        .filter((row) => row.pending > 0)
        .sort((a, b) => b.pending - a.pending),
    [assignments]
  );

  const attendanceRates = (stats.data?.kind === "teacher" ? stats.data.courses : [])
    .map((course) => course.attendanceRate)
    .filter((value): value is number => typeof value === "number");

  const pendingTotal =
    dashboard.data?.submissionsPending ?? toReview.reduce((sum, row) => sum + row.pending, 0);
  const studentTotal =
    dashboard.data?.studentsTotal ?? groups.reduce((sum, course) => sum + (course.studentCount || 0), 0);
  const attendance =
    dashboard.data?.attendanceRateWeek ??
    (attendanceRates.length
      ? Math.round(attendanceRates.reduce((sum, value) => sum + value, 0) / attendanceRates.length)
      : null);

  const studentsByCourse = new Map(groups.map((course) => [course.id, course.studentCount ?? 0]));
  const toneByCourse = new Map(groups.map((course) => [course.id, course.color]));
  const avatarByCourse = new Map(groups.map((course) => [course.id, course.avatarUrl]));

  const roomByCourse = new Map(
    (conversations.data ?? [])
      .filter((item) => item.courseId)
      .map((item) => [item.courseId as string, item.id])
  );

  const loading = courses.isLoading || lessons.isLoading;

  if (!loading && !groups.length)
    return (
      <DashboardShell
        user={user?.name ?? ""}
        dateLine={`${weekdays[(today.getDay() + 6) % 7] ?? ""}, ${today.getDate()}-${(
          months[today.getMonth()] ?? ""
        ).toLowerCase()}`}
        online={online}
        approved={user?.isApproved !== false}
        onSearch={() => setSearchOpen(true)}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
      >
        <DashboardEmptyGroups onCreate={() => navigate(ROUTES.teacher.workspace)} />
      </DashboardShell>
    );

  return (
    <DashboardShell
      user={user?.name ?? ""}
      dateLine={`${weekdays[(today.getDay() + 6) % 7] ?? ""}, ${today.getDate()}-${(
        months[today.getMonth()] ?? ""
      ).toLowerCase()} · ${t("header.lessonCount", { count: todayLessons.length })}`}
      online={online}
      approved={user?.isApproved !== false}
      onSearch={() => setSearchOpen(true)}
      searchOpen={searchOpen}
      onSearchOpenChange={setSearchOpen}
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_376px]">
          <div className="flex min-w-0 flex-col gap-6">
            {heroLesson ? (
              <DashboardHero
                lesson={heroLesson}
                live={Boolean(liveLesson)}
                studentCount={studentsByCourse.get(heroLesson.courseId) ?? 0}
                hasQuiz={Boolean(heroLesson.quizId)}
                joinedCount={liveLesson ? (presence.data?.count ?? null) : null}
                onOpen={() => navigate(ROUTES.live(heroLesson.id))}
                onChat={() => {
                  const room = roomByCourse.get(heroLesson.courseId);
                  navigate(room ? ROUTES.teacher.chat(room) : ROUTES.teacher.chats);
                }}
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                value={String(todayLessons.length)}
                label={t("stats.lessons")}
                hint={t("stats.lessonsHint", { count: finishedCount })}
              />
              <StatCard
                value={String(pendingTotal)}
                tone="text-brand"
                label={t("stats.review")}
                hint={t("stats.reviewHint", { count: toReview.length })}
              />
              <StatCard
                value={String(studentTotal)}
                label={t("stats.students")}
                hint={t("stats.studentsHint", { count: groups.length })}
              />
              <StatCard
                value={attendance === null ? "—" : `${attendance}%`}
                tone="text-success-fg"
                label={t("stats.attendance")}
                hint={t("stats.attendanceHint")}
              />
            </div>

            <section className="flex flex-col gap-3">
              {todayLessons.length ? (
                <SectionHeader
                  title={t("today.title")}
                  actionLabel={t("common.seeAll")}
                  onAction={() => navigate(ROUTES.teacher.schedule)}
                />
              ) : null}

              {todayLessons.length ? (
                <div className="flex flex-col overflow-hidden rounded-lg bg-surface">
                  {todayLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      className="flex items-center gap-4 border-b border-line px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-subtle"
                      onClick={() => navigate(ROUTES.live(lesson.id))}
                    >
                      <span className="flex w-12 shrink-0 flex-col">
                        <strong className="text-title-sm text-ink">{clock(lesson.startsAt)}</strong>
                        <small className="text-caption text-ink-tertiary">
                          {endClock(lesson.startsAt, lesson.durationMinutes)}
                        </small>
                      </span>
                      <GroupTile
                        name={lesson.courseTitle}
                        tone={toneByCourse.get(lesson.courseId)}
                        src={avatarByCourse.get(lesson.courseId)}
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-title-md text-ink">
                          {lesson.courseTitle}
                        </strong>
                        <small className="truncate text-body-sm text-ink-tertiary">
                          {lesson.status === "finished"
                            ? t("today.finished", {
                                count: studentsByCourse.get(lesson.courseId) ?? 0,
                              })
                            : t("today.students", {
                                count: studentsByCourse.get(lesson.courseId) ?? 0,
                              })}
                        </small>
                      </span>
                      <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-6 py-10 text-center">
                  <span className="grid size-14 place-items-center rounded-2xl bg-accent-green-bg text-accent-green-fg">
                    <Icon name="nav-calendar" size={26} />
                  </span>
                  <strong className="font-heading text-h2 text-ink">{t("today.emptyTitle")}</strong>
                  <p className="text-body-sm text-ink-secondary">
                    {lessons.data?.length
                      ? t("today.emptyNext", {
                          time: clock(upcoming(lessons.data)?.startsAt ?? ""),
                          title: upcoming(lessons.data)?.courseTitle ?? "",
                        })
                      : t("today.emptyHint")}
                  </p>
                  <span className="mt-1 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      className="flex h-11 items-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
                      onClick={() => navigate(ROUTES.teacher.schedule)}
                    >
                      {t("today.openSchedule")}
                    </button>
                    <button
                      type="button"
                      className="flex h-11 items-center rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong"
                      onClick={() => navigate(ROUTES.teacher.schedule)}
                    >
                      {t("today.addLesson")}
                    </button>
                  </span>
                </div>
              )}
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <section className="flex flex-col gap-3">
              <SectionHeader
                title={t("review.title")}
                actionLabel={t("common.seeAll")}
                onAction={() => navigate(ROUTES.teacher.homework)}
              />
              <div className="flex flex-col overflow-hidden rounded-lg bg-surface">
                {toReview.slice(0, 3).map(({ assignment, pending }) => (
                  <button
                    key={assignment.id}
                    type="button"
                    className="flex items-center gap-3 border-b border-line px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-subtle"
                    onClick={() => navigate(ROUTES.teacher.homework)}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-blue-bg text-accent-blue-fg">
                      <Icon name="assign" size={20} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm text-ink">{assignment.title}</strong>
                      <small className="truncate text-caption text-ink-tertiary">
                        {assignment.courseTitle} ·{" "}
                        {t("review.submitted", {
                          done: assignment.submissions.length,
                          total: assignment.stats?.studentsCount ?? assignment.submissions.length,
                        })}
                      </small>
                    </span>
                    <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-brand px-2 text-caption-strong text-ink-inverse">
                      {pending}
                    </span>
                  </button>
                ))}
                {!toReview.length ? (
                  <p className="px-4 py-8 text-center text-body-sm text-ink-tertiary">
                    {t("review.empty")}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <SectionHeader title={t("activity.title")} />
              <div className="flex flex-col overflow-hidden rounded-lg bg-surface">
                {(activity.data ?? []).slice(0, 4).map((item) => (
                  <span
                    key={item.id}
                    className="flex items-start gap-3 border-b border-line px-5 py-4 last:border-b-0"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-subtle text-icon-secondary">
                      <Icon name={activityIcon(item.category)} size={20} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm text-ink">{item.title}</strong>
                      <small className="truncate text-caption text-ink-tertiary">{item.body}</small>
                    </span>
                    <small className="shrink-0 text-caption text-ink-tertiary">
                      {clock(item.createdAt)}
                    </small>
                  </span>
                ))}
                {!(activity.data ?? []).length ? (
                  <p className="px-4 py-8 text-center text-body-sm text-ink-tertiary">
                    {t("activity.empty")}
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function upcoming(items: ReturnType<typeof useLessons>["data"]) {
  const now = Date.now();
  return (items ?? [])
    .filter((lesson) => new Date(lesson.startsAt).getTime() > now && lesson.status === "scheduled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
}

function activityIcon(kind: string | null): string {
  if (!kind) return "bell";
  if (kind.includes("member")) return "person-add";
  if (kind.includes("rating") || kind.includes("grade")) return "star";
  if (kind.includes("quiz") || kind.includes("exam")) return "quiz";
  if (kind.includes("homework") || kind.includes("assignment")) return "assign";
  if (kind.includes("lesson")) return "nav-calendar";
  if (kind.includes("submission")) return "check-circle";
  if (kind.includes("mention")) return "alternate-email";
  if (kind.includes("payment")) return "payments";
  if (kind.includes("announcement")) return "campaign";
  return "bell";
}

interface DashboardShellProps {
  user: string;
  dateLine: string;
  online: boolean;
  approved: boolean;
  searchOpen: boolean;
  onSearch: () => void;
  onSearchOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function DashboardShell({
  user,
  dateLine,
  online,
  approved,
  searchOpen,
  onSearch,
  onSearchOpenChange,
  children,
}: DashboardShellProps) {
  const { t } = useTranslation("dashboard");

  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto bg-canvas bg-page-gradient">
      <div className="flex flex-col gap-6 px-8 py-7">
        <header className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <small className="text-caption text-ink-tertiary">{dateLine}</small>
            <h1 className="truncate font-heading text-display text-ink">
              {t("header.greeting", { name: user.split(" ")[0] || user })}
            </h1>
          </div>

          <button
            type="button"
            className="flex h-11 w-full max-w-[320px] items-center gap-2.5 rounded-full border border-line-subtle bg-surface px-4 text-body-sm text-ink-tertiary transition-colors hover:bg-subtle"
            onClick={onSearch}
          >
            <Icon name="search" size={20} className="shrink-0 text-icon-tertiary" />
            <span className="min-w-0 flex-1 truncate text-left">{t("header.searchPlaceholder")}</span>
            <kbd className="shrink-0 rounded-lg bg-subtle px-2 py-1 text-caption text-ink-tertiary">
              ⌘ K
            </kbd>
          </button>

          <NotificationBell className="relative grid size-11 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle" />
        </header>

        {!online ? (
          <p className="flex items-center gap-3 rounded-2xl bg-surface-inverse px-5 py-4 text-body-sm text-ink-inverse">
            <Icon name="wifi" size={20} className="shrink-0" />
            {t("banner.offline")}
          </p>
        ) : null}

        {!approved ? (
          <p className="flex items-center gap-3 rounded-2xl bg-warning-bg px-5 py-4 text-body-sm text-warning-fg">
            <Icon name="warning" size={20} className="shrink-0" />
            {t("banner.notApproved")}
          </p>
        ) : null}

        {children}
      </div>

      <GlobalSearchDialog open={searchOpen} onOpenChange={onSearchOpenChange} />
    </main>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-1">
      <h2 className="min-w-0 flex-1 truncate font-heading text-h2 text-ink">{title}</h2>
      {actionLabel && onAction ? (
        <button type="button" className="shrink-0 text-label text-brand" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function StatCard({
  value,
  label,
  hint,
  tone = "text-ink",
}: {
  value: string;
  label: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface p-5">
      <small className="text-caption text-ink-secondary">{label}</small>
      <strong className={`font-heading text-numeric-lg font-numeric ${tone}`}>{value}</strong>
      <small className="text-caption text-ink-tertiary">{hint}</small>
    </div>
  );
}
