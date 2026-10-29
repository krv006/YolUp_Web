import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { notificationContent } from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { useOnline } from "@/shared/hooks/use-online";
import type { Lesson } from "@/shared/types";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { MobileListCard, MobileListRow } from "@/shared/ui/mobile-page";
import { CardsSkeleton } from "@/shared/ui/page-skeleton";
import { MobileUserHeader } from "@/widgets/mobile-user-header";
import { lessonClock } from "../lib/clock";
import type { useStudentHome } from "./use-student-home";

type Home = ReturnType<typeof useStudentHome>;

const DAY_MS = 86_400_000;

function endOf(lesson: Lesson): Date {
  return new Date(new Date(lesson.startsAt).getTime() + (lesson.durationMinutes || 45) * 60000);
}

export function StudentMobileHome({
  home,
  joinedCount,
  emptyHint,
}: {
  home: Home;
  joinedCount: number | null;
  emptyHint: string;
}) {
  const { t } = useTranslation("student");
  const navigate = useNavigate();
  const online = useOnline();
  const { now, heroLesson, todayLessons } = home;

  const openChat = (courseId: string) => {
    const room = home.roomByCourse.get(courseId);
    navigate(room ? ROUTES.student.chat(room) : ROUTES.student.chats);
  };

  function due(value: string): string {
    const date = new Date(value);
    if (date.toDateString() === now.toDateString()) return t("home.tasks.today", { time: lessonClock(date) });
    if (date.toDateString() === new Date(now.getTime() + DAY_MS).toDateString())
      return t("home.tasks.tomorrow", { time: lessonClock(date) });
    return t("home.tasks.daysLeft", { count: Math.ceil((date.getTime() - now.getTime()) / DAY_MS) });
  }

  const nearest = home.tasks.find((task) => task.dueAt);

  return (
    <main className="h-full overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink">
      <div className="flex flex-col gap-6">
        <MobileUserHeader />

        {!online ? (
          <p className="flex h-11 items-center gap-3 rounded-xl bg-surface-inverse px-4 text-body-sm text-ink-inverse">
            <Icon name="wifi" size={20} className="shrink-0" />
            <span className="truncate">{t("home.offline")}</span>
          </p>
        ) : null}

        {home.loading ? (
          <CardsSkeleton />
        ) : (
          <>
            {heroLesson ? (
              <Hero home={home} lesson={heroLesson} joinedCount={joinedCount} onChat={openChat} />
            ) : null}

            {home.tasks.length ? (
              <button
                type="button"
                className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3.5 text-left"
                onClick={() => navigate(ROUTES.student.homework)}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-saffron-bg text-accent-saffron-fg">
                  <Icon name="assign" size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title text-ink">{t("home.mobile.tasksTitle")}</strong>
                  <small className="truncate text-body-sm text-ink-secondary">
                    {nearest?.dueAt
                      ? t("home.mobile.tasksHint", { count: home.tasks.length, when: due(nearest.dueAt) })
                      : t("home.tasks.test", { count: home.tasks.length })}
                  </small>
                </span>
                <span className="flex h-7 min-w-8.5 shrink-0 items-center justify-center rounded-full bg-brand px-2 text-label-strong text-on-action">
                  {home.tasks.length}
                </span>
                <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
              </button>
            ) : null}

            {todayLessons.length ? (
              <section className="flex flex-col gap-3">
                <span className="flex items-center gap-3">
                  <h2 className="min-w-0 flex-1 truncate font-heading text-title text-ink">{t("home.today.title")}</h2>
                  <button
                    type="button"
                    className="shrink-0 text-body-sm font-medium text-brand-strong"
                    onClick={() => navigate(ROUTES.student.schedule)}
                  >
                    {t("home.seeAll")}
                  </button>
                </span>
                <div className="flex flex-col overflow-hidden rounded-xl bg-surface py-1">
                  {todayLessons.map((lesson) => {
                    const live = lesson.status === "live";
                    const finished = lesson.status === "finished";
                    const course = home.courseById.get(lesson.courseId);
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        className={`flex items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-b-0 ${
                          live ? "bg-brand-subtle" : ""
                        }`}
                        onClick={() => navigate(finished ? ROUTES.student.recording(lesson.id) : ROUTES.live(lesson.id))}
                      >
                        <span className="flex w-11 shrink-0 flex-col">
                          <strong className={`text-title-sm ${live ? "text-brand" : finished ? "text-ink-secondary" : "text-ink"}`}>
                            {lessonClock(new Date(lesson.startsAt))}
                          </strong>
                          <small className="text-caption text-ink-secondary">{lessonClock(endOf(lesson))}</small>
                        </span>
                        <GroupTile
                          name={lesson.courseTitle}
                          tone={course?.color}
                          src={course?.avatarUrl}
                          className="size-11 rounded-xl"
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <strong className={`truncate text-title ${finished ? "text-ink-secondary" : "text-ink"}`}>
                            {lesson.courseTitle}
                          </strong>
                          {live ? (
                            <small className="flex items-center gap-1.5 truncate text-body-sm text-danger">
                              <i className="size-2 shrink-0 rounded-full bg-danger not-italic" />
                              {t("home.mobile.liveRow")}
                            </small>
                          ) : finished ? (
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
                        {live ? (
                          <span className="flex h-9 shrink-0 items-center rounded-full bg-brand px-4 text-button text-on-action">
                            {t("home.mobile.enter")}
                          </span>
                        ) : (
                          <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section className="flex flex-col gap-4 rounded-xl bg-surface p-4">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-success-bg text-success-fg">
                    <Icon name="event-fill" size={22} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title text-ink">{t("home.today.emptyTitle")}</strong>
                    <small className="line-clamp-2 text-body-sm text-ink-secondary">{emptyHint}</small>
                  </span>
                </span>
                <button
                  type="button"
                  className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand-subtle text-button text-brand"
                  onClick={() => navigate(ROUTES.student.schedule)}
                >
                  <Icon name="nav-calendar" size={18} />
                  {t("home.today.openSchedule")}
                </button>
              </section>
            )}

            {home.recentGrades.length ? (
              <section className="flex flex-col gap-3">
                <h2 className="font-heading text-title text-ink">{t("home.grades.title")}</h2>
                <MobileListCard>
                  {home.recentGrades.slice(0, 3).map((item) => {
                    const { title, body } = notificationContent(item);
                    return (
                      <MobileListRow
                        key={item.id}
                        icon={item.link?.type === "submission" ? "quiz" : "star"}
                        tone="bg-accent-saffron-bg text-accent-saffron-fg"
                        title={title}
                        subtitle={body}
                        chevron={false}
                      />
                    );
                  })}
                </MobileListCard>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function Hero({
  home,
  lesson,
  joinedCount,
  onChat,
}: {
  home: Home;
  lesson: Lesson;
  joinedCount: number | null;
  onChat: (courseId: string) => void;
}) {
  const { t } = useTranslation("student");
  const navigate = useNavigate();
  const now = home.now.getTime();
  const start = new Date(lesson.startsAt);
  const live = lesson.status === "live";
  const today = start.toDateString() === new Date(now).toDateString();
  const minutesToStart = Math.round((start.getTime() - now) / 60000);
  const minutesLive = Math.max(0, Math.round((now - start.getTime()) / 60000));
  const teacher = home.courseById.get(lesson.courseId)?.teacher ?? "";

  const badge = live
    ? t("home.hero.live", { count: minutesLive })
    : !today
      ? t("home.hero.tomorrow", { time: lessonClock(start) })
      : minutesToStart <= 0
        ? t("home.hero.startsNow")
        : minutesToStart < 60
          ? t("home.hero.startsIn", { count: minutesToStart })
          : t("home.hero.startsInHours", { count: Math.round(minutesToStart / 60) });

  const meta = live
    ? [teacher, joinedCount !== null ? t("home.hero.inLesson", { count: joinedCount }) : ""]
    : [`${lessonClock(start)} – ${lessonClock(endOf(lesson))}`, teacher];

  return (
    <section className="flex flex-col rounded-xl bg-brand p-4 text-on-action">
      <span className="flex h-6 w-fit items-center gap-1.5 rounded-full bg-on-brand-subtle px-2.5 text-caption-strong">
        <i className={`size-2 rounded-full not-italic ${live ? "bg-danger" : "bg-saffron"}`} />
        {badge}
      </span>
      <strong className="mt-3 truncate font-heading text-title-lg">
        {lesson.title ? `${lesson.courseTitle} — ${lesson.title}` : lesson.courseTitle}
      </strong>
      <small className="mt-0.5 truncate text-body-sm text-on-action/85">{meta.filter(Boolean).join(" · ")}</small>
      <span className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-surface text-button text-ink"
          onClick={() => navigate(today ? ROUTES.live(lesson.id) : ROUTES.student.schedule)}
        >
          <Icon name={today ? "videocam-fill" : "nav-calendar"} size={20} className="shrink-0" />
          {today ? t("home.hero.join") : t("home.hero.details")}
        </button>
        <button
          type="button"
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-brand-subtle px-4 text-button text-brand"
          onClick={() => onChat(lesson.courseId)}
        >
          <Icon name="chat" size={18} />
          {t("home.mobile.chat")}
        </button>
      </span>
    </section>
  );
}
