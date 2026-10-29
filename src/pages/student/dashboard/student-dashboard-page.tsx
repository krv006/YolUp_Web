import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useLessonPresence } from "@/modules/live";
import { notificationContent } from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { useOnline } from "@/shared/hooks/use-online";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { CardsSkeleton } from "@/shared/ui/page-skeleton";
import { DashboardShell } from "@/widgets/dashboard-shell";
import { lessonClock } from "../lib/clock";
import { StudentHero } from "./student-hero";
import { StudentMobileHome } from "./student-mobile-home";
import { useStudentHome, type StudentTask } from "./use-student-home";

const DAY_MS = 86_400_000;

function SectionTitle({ children, heading = false, action }: { children: string; heading?: boolean; action?: { label: string; run: () => void } }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className={`min-w-0 flex-1 truncate text-ink ${heading ? "font-heading text-[15.5px]/5 font-semibold" : "text-title font-medium"}`}>
        {children}
      </h2>
      {action ? (
        <button type="button" className="shrink-0 text-body-xs font-medium text-brand" onClick={action.run}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

function Stat({ label, value, hint, tone = "text-ink" }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <div className="flex flex-col rounded-2xl bg-surface px-[18px] pt-[17px] pb-[18px]">
      <small className="text-body-xs text-ink-secondary">{label}</small>
      <strong className={`mt-2 font-heading text-[28px]/[34px] font-semibold ${tone}`}>{value}</strong>
      <small className="mt-[3px] text-caption font-normal text-ink-secondary">{hint}</small>
    </div>
  );
}

export function StudentDashboardPage() {
  const { t } = useTranslation("student");
  const { t: td } = useTranslation("dashboard");
  const weekdays = useTranslation("lesson").t("list.weekdaysLong", { returnObjects: true }) as string[];
  const months = td("months", { returnObjects: true }) as string[];
  const navigate = useNavigate();
  const { user } = useAuth();
  const online = useOnline();
  const isCompact = useIsCompact();
  const [searchOpen, setSearchOpen] = useState(false);
  const home = useStudentHome();
  const presence = useLessonPresence(home.liveLesson?.id, Boolean(home.liveLesson));
  const { now } = home;

  const teacherOf = (courseId: string) => home.courseById.get(courseId)?.teacher ?? "";
  const openChat = (courseId: string) => {
    const room = home.roomByCourse.get(courseId);
    navigate(room ? ROUTES.student.chat(room) : ROUTES.student.chats);
  };
  const dayLabel = (date: Date) => `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;

  function taskMeta(task: StudentTask): string {
    if (task.kind === "quiz") return [task.courseTitle, t("home.tasks.test", { count: task.item.questionCount })].filter(Boolean).join(" · ");
    const due = new Date(task.dueAt as string);
    const days = Math.ceil((due.getTime() - now.getTime()) / DAY_MS);
    const when =
      due.toDateString() === now.toDateString()
        ? t("home.tasks.today", { time: lessonClock(due) })
        : due.toDateString() === new Date(now.getTime() + DAY_MS).toDateString()
          ? t("home.tasks.tomorrow", { time: lessonClock(due) })
          : t("home.tasks.daysLeft", { count: days });
    return [task.courseTitle, when].filter(Boolean).join(" · ");
  }

  function gradeTime(value: string): string {
    const date = new Date(value);
    if (date.toDateString() === now.toDateString()) return lessonClock(date);
    if (date.toDateString() === new Date(now.getTime() - DAY_MS).toDateString()) return t("home.grades.yesterday");
    return dayLabel(date);
  }

  const upcoming = home.heroLesson && home.heroLesson.status === "scheduled" && !home.todayLessons.length ? home.heroLesson : null;
  const emptyHint = upcoming
    ? new Date(upcoming.startsAt).toDateString() === new Date(now.getTime() + DAY_MS).toDateString()
      ? t("home.today.emptyNext", { time: lessonClock(new Date(upcoming.startsAt)), title: upcoming.courseTitle })
      : t("home.today.emptyLater", { date: dayLabel(new Date(upcoming.startsAt)), title: upcoming.courseTitle })
    : t("home.today.emptyNone");

  if (isCompact)
    return (
      <StudentMobileHome
        home={home}
        joinedCount={home.liveLesson ? (presence.data?.count ?? null) : null}
        emptyHint={emptyHint}
      />
    );

  return (
    <DashboardShell
      user={user?.name ?? ""}
      dateLine={`${weekdays[(now.getDay() + 6) % 7] ?? ""}, ${dayLabel(now)} · ${
        home.todayLessons.length ? t("home.lessonCount", { count: home.todayLessons.length }) : t("home.noLessons")
      }`}
      online={online}
      approved
      searchPlaceholder={t("home.searchPlaceholder")}
      onSearch={() => setSearchOpen(true)}
      searchOpen={searchOpen}
      onSearchOpenChange={setSearchOpen}
    >
      {home.loading ? (
        <div className="max-w-[728px]">
          <CardsSkeleton />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-5">
            {home.heroLesson ? (
              <StudentHero
                lesson={home.heroLesson}
                teacher={teacherOf(home.heroLesson.courseId)}
                joinedCount={home.liveLesson ? (presence.data?.count ?? null) : null}
                onJoin={() => navigate(ROUTES.live(home.heroLesson?.id ?? ""))}
                onDetails={() => navigate(ROUTES.student.schedule)}
                onChat={() => openChat(home.heroLesson?.courseId ?? "")}
              />
            ) : null}

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Stat
                value={String(home.todayLessons.length)}
                label={t("home.stats.lessons")}
                hint={home.todayLessons.length ? t("home.stats.lessonsDone", { count: home.finishedToday }) : t("home.stats.dayOff")}
              />
              <Stat
                value={String(home.tasks.length)}
                tone="text-brand"
                label={t("home.stats.tasks")}
                hint={
                  home.dueToday
                    ? t("home.stats.tasksToday", { count: home.dueToday })
                    : home.dueTomorrow
                      ? t("home.stats.tasksTomorrow", { count: home.dueTomorrow })
                      : t("home.stats.tasksLater")
                }
              />
              <Stat
                value={home.avgGrade === null ? "—" : home.avgGrade.toFixed(1).replace(".", ",")}
                label={t("home.stats.grade")}
                hint={t("home.stats.gradeHint")}
              />
              <Stat
                value={home.attendanceRate === null ? "—" : `${home.attendanceRate}%`}
                tone="text-success-fg"
                label={t("home.stats.attendance")}
                hint={t("home.stats.attendanceHint")}
              />
            </div>

            {home.todayLessons.length ? (
              <section className="flex flex-col gap-3.5">
                <SectionTitle heading action={{ label: t("home.seeAll"), run: () => navigate(ROUTES.student.schedule) }}>
                  {t("home.today.title")}
                </SectionTitle>
                <div className="flex flex-col overflow-hidden rounded-2xl bg-surface pb-1">
                  {home.todayLessons.map((lesson) => {
                    const course = home.courseById.get(lesson.courseId);
                    const finished = lesson.status === "finished";
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        className="flex h-[75px] items-center gap-3 border-b border-line px-4 text-left transition-colors hover:bg-subtle"
                        onClick={() => navigate(finished ? ROUTES.student.recording(lesson.id) : ROUTES.live(lesson.id))}
                      >
                        <span className="flex w-11 shrink-0 flex-col">
                          <strong className="text-body-sm font-semibold text-ink">{lessonClock(new Date(lesson.startsAt))}</strong>
                          <small className="text-caption font-normal text-ink-secondary">
                            {lessonClock(new Date(new Date(lesson.startsAt).getTime() + (lesson.durationMinutes || 45) * 60000))}
                          </small>
                        </span>
                        <GroupTile
                          name={lesson.courseTitle}
                          tone={course?.color}
                          src={course?.avatarUrl}
                          className={`size-11 rounded-lg bg-subtle ${finished ? "opacity-60" : ""}`}
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <strong className={`truncate text-title font-medium ${finished ? "text-ink-secondary" : "text-ink"}`}>
                            {lesson.courseTitle}
                          </strong>
                          {finished ? (
                            <small className="flex items-center gap-1 truncate text-body-sm text-success-fg">
                              <Icon name="check" size={16} className="shrink-0" />
                              {t("home.today.finished", { teacher: course?.teacher ?? "" })}
                            </small>
                          ) : (
                            <small className="truncate text-body-sm text-ink-secondary">
                              {[course?.teacher, lesson.title].filter(Boolean).join(" · ")}
                            </small>
                          )}
                        </span>
                        <Icon name="chevron-right" size={20} className="shrink-0 text-ink-secondary" />
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section className="flex flex-col items-center rounded-2xl bg-surface px-6 pt-7 pb-7 text-center">
                <span className="grid size-16 place-items-center rounded-xl bg-success-bg text-success">
                  <Icon name="event-fill" size={28} />
                </span>
                <strong className="mt-3 font-heading text-h2 font-semibold text-ink">{t("home.today.emptyTitle")}</strong>
                <p className="mt-2 text-body-sm text-ink-secondary">{emptyHint}</p>
                <button
                  type="button"
                  className="mt-2.5 flex h-[42px] items-center rounded-full border border-line-strong bg-surface px-[15px] text-button text-ink transition-colors hover:bg-subtle"
                  onClick={() => navigate(ROUTES.student.schedule)}
                >
                  {t("home.today.openSchedule")}
                </button>
              </section>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <section className="flex flex-col gap-3">
              <SectionTitle action={{ label: t("home.seeAll"), run: () => navigate(ROUTES.student.homework) }}>
                {t("home.tasks.title")}
              </SectionTitle>
              <div className="flex flex-col overflow-hidden rounded-2xl bg-surface">
                {home.tasks.slice(0, 3).map((task) => (
                  <button
                    key={`${task.kind}-${task.id}`}
                    type="button"
                    className="flex h-[74px] items-center gap-3 px-[18px] text-left transition-colors hover:bg-subtle"
                    onClick={() =>
                      navigate(task.kind === "quiz" ? ROUTES.student.test(task.id) : ROUTES.student.homeworkItem(task.id))
                    }
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
                      <Icon name="assign" size={20} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-body-sm font-semibold text-ink">{task.title}</strong>
                      <small className="truncate text-caption font-normal text-ink-secondary">{taskMeta(task)}</small>
                    </span>
                  </button>
                ))}
                {!home.tasks.length ? (
                  <p className="px-4 py-8 text-center text-body-sm text-ink-secondary">{t("home.tasks.empty")}</p>
                ) : null}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <SectionTitle>{t("home.grades.title")}</SectionTitle>
              <div className="flex flex-col overflow-hidden rounded-2xl bg-surface">
                {home.recentGrades.slice(0, 3).map((item) => {
                  const { title, body } = notificationContent(item);
                  return (
                    <span key={item.id} className="flex h-[72px] items-center gap-3 pr-5 pl-[18px]">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-subtle text-ink">
                        <Icon name={item.link?.type === "submission" ? "quiz" : "star"} size={18} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-body-sm font-semibold text-ink">{title}</strong>
                        <small className="mt-0.5 truncate text-caption font-normal text-ink-secondary">{body}</small>
                      </span>
                      <small className="shrink-0 self-start pt-[17px] text-caption font-normal text-ink-secondary">{gradeTime(item.createdAt)}</small>
                    </span>
                  );
                })}
                {!home.recentGrades.length ? (
                  <p className="px-4 py-8 text-center text-body-sm text-ink-secondary">{t("home.grades.empty")}</p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
