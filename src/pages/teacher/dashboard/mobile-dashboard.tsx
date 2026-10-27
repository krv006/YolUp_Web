import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Lesson } from "@/shared/types";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { MobileTeacherHeader } from "@/widgets/mobile-teacher-header";

const TICK_MS = 30_000;

function clockOf(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function endOf(lesson: Lesson): Date {
  return new Date(new Date(lesson.startsAt).getTime() + (lesson.durationMinutes || 45) * 60000);
}

export interface MobileDashboardProps {
  online: boolean;
  loading: boolean;
  hasGroups: boolean;
  heroLesson: Lesson | null;
  live: boolean;
  heroStudents: number;
  joinedCount: number | null;
  pendingWorks: number;
  pendingTasks: number;
  todayLessons: Lesson[];
  tomorrowLessons: Lesson[];
  nextLesson: Lesson | null;
  studentsByCourse: Map<string, number>;
  toneByCourse: Map<string, string | undefined>;
  avatarByCourse: Map<string, string | null | undefined>;
  onOpenLesson: (lesson: Lesson) => void;
  onChat: (lesson: Lesson) => void;
  onReview: () => void;
  onSchedule: () => void;
  onCreateGroup: () => void;
}

export function MobileDashboard(props: MobileDashboardProps) {
  const { t } = useTranslation("dashboard");
  const {
    online,
    loading,
    hasGroups,
    heroLesson,
    todayLessons,
    tomorrowLessons,
    pendingWorks,
    pendingTasks,
    onReview,
    onSchedule,
    onCreateGroup,
  } = props;

  return (
    <main className="h-full overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink">
      <div className={`flex flex-col ${online ? "gap-6" : "gap-5"}`}>
        <MobileTeacherHeader />

        {!online ? (
          <p className="flex h-11 items-center gap-3 rounded-xl bg-surface-inverse px-4 text-body-sm text-ink-inverse">
            <Icon name="wifi" size={20} className="shrink-0" />
            <span className="truncate">{t("mobile.offline")}</span>
          </p>
        ) : null}

        {loading ? (
          <DashboardSkeleton title={t("mobile.todayTitle")} />
        ) : !hasGroups ? (
          <NoGroups onCreate={onCreateGroup} />
        ) : (
          <>
            {heroLesson ? (
              <Hero {...props} lesson={heroLesson} />
            ) : !todayLessons.length ? (
              <NoLessons next={props.nextLesson} onAdd={onSchedule} />
            ) : null}

            {pendingWorks > 0 ? (
              <button
                type="button"
                className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3.5 text-left"
                onClick={onReview}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-saffron-bg text-accent-saffron-fg">
                  <Icon name="assign" size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title text-ink">{t("mobile.reviewTitle")}</strong>
                  <small className="truncate text-body-sm text-ink-secondary">
                    {t("mobile.reviewHint", { works: pendingWorks, tasks: pendingTasks })}
                  </small>
                </span>
                <span className="flex h-7 min-w-8.5 shrink-0 items-center justify-center rounded-full bg-brand px-2 text-label-strong text-on-action">
                  {pendingWorks}
                </span>
                <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
              </button>
            ) : null}

            {todayLessons.length ? (
              <Section
                title={t("mobile.todayTitle")}
                action={t("mobile.seeAll")}
                onAction={onSchedule}
              >
                <LessonList {...props} lessons={todayLessons} />
              </Section>
            ) : tomorrowLessons.length ? (
              <Section
                title={t("mobile.tomorrowTitle")}
                action={t("mobile.schedule")}
                onAction={onSchedule}
              >
                <LessonList {...props} lessons={tomorrowLessons} upcoming />
              </Section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function Hero(props: MobileDashboardProps & { lesson: Lesson }) {
  const { t } = useTranslation("dashboard");
  const { lesson, live, heroStudents, joinedCount, onOpenLesson, onChat } = props;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setNow(Date.now()), TICK_MS);
    return () => globalThis.clearTimeout(timer);
  }, [now]);

  const start = new Date(lesson.startsAt);
  const minutesToStart = Math.round((start.getTime() - now) / 60000);
  const minutesLive = Math.max(0, Math.round((now - start.getTime()) / 60000));
  const range = `${clockOf(start)} – ${clockOf(endOf(lesson))}`;
  const topic = lesson.topic || lesson.title;

  const badge = live
    ? t("mobile.live", { count: minutesLive })
    : minutesToStart <= 0
      ? t("mobile.startsNow")
      : minutesToStart < 60
        ? t("mobile.startsIn", { count: minutesToStart })
        : t("mobile.startsInHours", { count: Math.round(minutesToStart / 60) });

  const meta = live
    ? [t("mobile.joined", { done: joinedCount ?? 0, total: heroStudents }), range]
    : [range, t("mobile.students", { count: heroStudents }), lesson.quizId ? t("mobile.quizAttached") : null];

  return (
    <section className="flex flex-col rounded-xl bg-brand p-4 text-on-action">
      <span className="flex h-6 w-fit items-center gap-1.5 rounded-full bg-on-brand-subtle px-2.5 text-caption-strong">
        <i className={`size-2 rounded-full not-italic ${live ? "bg-danger" : "bg-saffron"}`} />
        {badge}
      </span>

      <strong className="mt-3 truncate font-heading text-title-lg">
        {topic ? `${lesson.courseTitle} — ${topic}` : lesson.courseTitle}
      </strong>
      <small className="mt-0.5 truncate text-body-sm text-on-action/85">
        {meta.filter(Boolean).join(" · ")}
      </small>

      <span className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-surface text-button text-ink"
          onClick={() => onOpenLesson(lesson)}
        >
          <Icon name="videocam-fill" size={20} className="shrink-0" />
          {live ? t("mobile.join") : t("mobile.start")}
        </button>
        {live ? null : (
          <button
            type="button"
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-brand-subtle px-4 text-button text-brand"
            onClick={() => onChat(lesson)}
          >
            <Icon name="chat" size={18} />
            {t("mobile.chat")}
          </button>
        )}
      </span>
    </section>
  );
}

function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <span className="flex items-center gap-3">
        <h2 className="min-w-0 flex-1 truncate font-heading text-title text-ink">{title}</h2>
        <button type="button" className="shrink-0 text-body-sm font-medium text-brand-strong" onClick={onAction}>
          {action}
        </button>
      </span>
      {children}
    </section>
  );
}

function LessonList(props: MobileDashboardProps & { lessons: Lesson[]; upcoming?: boolean }) {
  const { t } = useTranslation("dashboard");
  const { lessons, studentsByCourse, toneByCourse, avatarByCourse, onOpenLesson, upcoming } = props;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface py-1">
      {lessons.map((lesson) => {
        const live = !upcoming && lesson.status === "live";
        const finished = !upcoming && lesson.status === "finished";
        const students = studentsByCourse.get(lesson.courseId) ?? 0;
        return (
          <div
            key={lesson.id}
            role="button"
            tabIndex={0}
            className={`flex items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-b-0 ${
              live ? "bg-brand-subtle" : ""
            }`}
            onClick={() => onOpenLesson(lesson)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onOpenLesson(lesson);
            }}
          >
            <span className="flex w-11 shrink-0 flex-col">
              <strong
                className={`text-title-sm ${live ? "text-brand" : finished ? "text-ink-secondary" : "text-ink"}`}
              >
                {clockOf(lesson.startsAt)}
              </strong>
              <small className="text-caption text-ink-secondary">{clockOf(endOf(lesson))}</small>
            </span>
            <GroupTile
              name={lesson.courseTitle}
              tone={toneByCourse.get(lesson.courseId)}
              src={avatarByCourse.get(lesson.courseId)}
              className="size-11 rounded-xl"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong
                className={`truncate text-title ${finished ? "text-ink-secondary" : "text-ink"}`}
              >
                {lesson.courseTitle}
              </strong>
              {live ? (
                <small className="flex items-center gap-1.5 truncate text-body-sm text-danger">
                  <i className="size-2 shrink-0 rounded-full bg-danger not-italic" />
                  {t("mobile.liveRow")}
                </small>
              ) : finished ? (
                <small className="flex items-center gap-1 truncate text-body-sm text-success-fg">
                  <Icon name="check" size={16} className="shrink-0" />
                  {t("mobile.finished", { count: students })}
                </small>
              ) : (
                <small className="truncate text-body-sm text-ink-secondary">
                  {t("mobile.students", { count: students })}
                </small>
              )}
            </span>
            {live ? (
              <span className="flex h-9 shrink-0 items-center rounded-full bg-brand px-4 text-button text-on-action">
                {t("mobile.enter")}
              </span>
            ) : (
              <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function NoLessons({ next, onAdd }: { next: Lesson | null; onAdd: () => void }) {
  const { t } = useTranslation("dashboard");
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-4">
      <span className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-success-bg text-success-fg">
          <Icon name="check-circle" size={22} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-title text-ink">{t("mobile.noLessonsTitle")}</strong>
          <small className="truncate text-body-sm text-ink-secondary">
            {next
              ? t("mobile.noLessonsNext", { time: clockOf(next.startsAt), title: next.courseTitle })
              : t("mobile.noLessonsHint")}
          </small>
        </span>
      </span>
      <button
        type="button"
        className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand-subtle text-button text-brand"
        onClick={onAdd}
      >
        <Icon name="add" size={18} />
        {t("mobile.addLesson")}
      </button>
    </section>
  );
}

const STEPS = [
  { id: "group", icon: "person", tone: "bg-brand-subtle text-ink" },
  { id: "link", icon: "chat", tone: "bg-success-bg text-success-fg" },
  { id: "lesson", icon: "clock", tone: "bg-accent-teal-bg text-accent-teal-fg" },
] as const;

function NoGroups({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation("dashboard");
  return (
    <>
      <section className="flex flex-col items-center rounded-xl bg-surface px-10 pt-7 pb-7 text-center">
        <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
          <Icon name="add" size={30} />
        </span>
        <strong className="mt-3 font-heading text-title font-medium whitespace-nowrap text-ink">{t("mobile.noGroupsTitle")}</strong>
        <p className="mt-3 text-body-sm text-ink-secondary">{t("mobile.noGroupsHint")}</p>
        <button
          type="button"
          className="mt-3 flex h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-button text-on-action"
          onClick={onCreate}
        >
          <Icon name="add" size={18} />
          {t("mobile.createGroup")}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-title text-ink">{t("mobile.stepsTitle")}</h2>
        <div className="flex flex-col overflow-hidden rounded-xl bg-surface">
          {STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              className="flex items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-b-0"
              onClick={onCreate}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${step.tone}`}>
                <Icon name={step.icon} size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title text-ink">{t(`mobile.steps.${step.id}.title`)}</strong>
                <small className="truncate text-body-sm text-ink-secondary">
                  {t(`mobile.steps.${step.id}.hint`)}
                </small>
              </span>
              <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function DashboardSkeleton({ title }: { title: string }) {
  return (
    <>
      <div className="flex h-37.5 animate-pulse flex-col gap-3 rounded-xl bg-brand-subtle p-4">
        <i className="h-3.5 w-30 rounded-full bg-surface not-italic" />
        <i className="h-5 w-65 rounded-full bg-surface not-italic" />
        <i className="h-3 w-22.5 rounded-full bg-surface not-italic" />
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-title text-ink">{title}</h2>
        <div className="flex flex-col overflow-hidden rounded-xl bg-surface py-1">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className="flex animate-pulse items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0"
            >
              <i className="h-9 w-11 shrink-0 rounded-md bg-subtle not-italic" />
              <i className="size-11 shrink-0 rounded-md bg-subtle not-italic" />
              <span className="flex min-w-0 flex-1 flex-col gap-2.5">
                <i className="h-3 w-35 rounded-full bg-subtle not-italic" />
                <i className="h-3 w-22.5 rounded-full bg-subtle not-italic" />
              </span>
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
