import { useTranslation } from "react-i18next";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Lesson } from "@/shared/types";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { MobileUserHeader } from "@/widgets/mobile-user-header";
import type { CourseLook } from "./lesson-tone";
import { MobileScheduleSkeleton, ScheduleError } from "./schedule-states";

export type MobileScheduleView = "day" | "week" | "month";

const VIEWS: MobileScheduleView[] = ["day", "week", "month"];
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
const SOON_MINUTES = 90;

export interface MobileScheduleProps {
  view: MobileScheduleView;
  anchor: Date;
  now: Date;
  online: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  lessons: Lesson[];
  courseLook: (courseId: string) => CourseLook;
  onView: (view: MobileScheduleView) => void;
  onAnchor: (date: Date) => void;
  onSelect: (lesson: Lesson) => void;
  onChat: (lesson: Lesson) => void;
  onJoin: (lesson: Lesson) => void;
  onCreate?: () => void;
  student?: boolean;
}

function clock(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function endOf(lesson: Lesson): Date {
  return new Date(new Date(lesson.startsAt).getTime() + (lesson.durationMinutes || 45) * 60_000);
}

function byStart(a: Lesson, b: Lesson): number {
  return a.startsAt.localeCompare(b.startsAt);
}

function onDay(lessons: Lesson[], day: Date): Lesson[] {
  return lessons.filter((lesson) => isSameDay(new Date(lesson.startsAt), day)).sort(byStart);
}

export function MobileSchedule(props: MobileScheduleProps) {
  const { t } = useTranslation("lesson");
  const { view, anchor, now, online, onView, onAnchor } = props;
  const months = t("list.months", { returnObjects: true }) as string[];

  const weekStart = startOfWeek(anchor, WEEK_OPTIONS);
  const weekEnd = endOfWeek(anchor, WEEK_OPTIONS);

  const aside =
    view === "week" ? (
      <span className="shrink-0 text-body-sm text-ink-secondary">
        {weekStart.getMonth() === weekEnd.getMonth()
          ? `${weekStart.getDate()} – ${weekEnd.getDate()} ${(months[weekEnd.getMonth()] ?? "").toLowerCase()}`
          : `${weekStart.getDate()} ${(months[weekStart.getMonth()] ?? "").toLowerCase()} – ${weekEnd.getDate()} ${(months[weekEnd.getMonth()] ?? "").toLowerCase()}`}
      </span>
    ) : view === "day" && isSameDay(anchor, now) ? null : (
      <button
        type="button"
        className="shrink-0 text-body-sm font-medium text-brand-strong"
        onClick={() => onAnchor(new Date(now))}
      >
        {t("schedule.today")}
      </button>
    );

  return (
    <main className="h-full overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink">
      <div className="flex flex-col gap-5">
        <MobileUserHeader />

        {!online ? (
          <p className="flex h-11 items-center gap-3 rounded-xl bg-surface-inverse px-4 text-body-sm text-ink-inverse">
            <Icon name="wifi" size={20} className="shrink-0" />
            <span className="truncate">{t("mobileSchedule.offline")}</span>
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="flex h-13 items-center rounded-full bg-surface p-1" role="tablist">
            {VIEWS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={view === item}
                className={`flex h-11 items-center rounded-full px-4 text-body-sm font-medium transition-colors ${
                  view === item ? "bg-brand text-on-action" : "text-ink"
                }`}
                onClick={() => onView(item)}
              >
                {t(`schedule.views.${item}`)}
              </button>
            ))}
          </div>
          <span className="min-w-0 flex-1" />
          {aside}
        </div>

        {view === "day" ? <DayView {...props} /> : null}
        {view !== "day" && props.loading ? <MobileScheduleSkeleton /> : null}
        {view !== "day" && props.error ? <ScheduleError onRetry={() => props.onRetry?.()} /> : null}
        {view === "week" && !props.loading && !props.error ? <WeekView {...props} /> : null}
        {view === "month" && !props.loading && !props.error ? <MonthView {...props} /> : null}
      </div>
    </main>
  );
}

function DayHeading({ day, now, count, pending = false }: { day: Date; now: Date; count: number; pending?: boolean }) {
  const { t } = useTranslation("lesson");
  const monthsLong = t("list.monthsLong", { returnObjects: true }) as string[];
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];
  const weekday = (day.getDay() + 6) % 7;
  const date = `${day.getDate()}-${(monthsLong[day.getMonth()] ?? "").toLowerCase()}`;

  return (
    <div className="flex items-center gap-3">
      <h2 className="min-w-0 flex-1 truncate font-heading text-title text-ink">
        {isSameDay(day, now) ? t("schedule.today") : weekdaysLong[weekday]}, {date}
      </h2>
      {pending ? null : (
        <small className="shrink-0 text-body-sm text-ink-secondary">
          {count ? t("schedule.lessonCount", { count }) : weekday === 6 ? t("schedule.dayOff") : t("schedule.noLessonsDay")}
        </small>
      )}
    </div>
  );
}

function DayView(props: MobileScheduleProps) {
  const { t } = useTranslation("lesson");
  const { anchor, now, lessons, onAnchor, onCreate } = props;
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const start = startOfWeek(anchor, WEEK_OPTIONS);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const rows = onDay(lessons, anchor);

  return (
    <>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const active = isSameDay(day, anchor);
          const has = lessons.some((lesson) => isSameDay(new Date(lesson.startsAt), day));
          const rest = index === 6;
          return (
            <button
              key={day.toISOString()}
              type="button"
              aria-pressed={active}
              className={`flex h-13.5 flex-col items-center rounded-lg pt-2 transition-colors ${
                active ? "bg-brand text-on-action" : `bg-surface ${rest ? "text-ink-disabled" : "text-ink"}`
              }`}
              onClick={() => onAnchor(day)}
            >
              <small className={`text-caption ${active ? "" : rest ? "" : "text-ink-secondary"}`}>
                {weekdays[index]}
              </small>
              <strong className="text-title-lg font-bold">{day.getDate()}</strong>
              {has && !active ? <i className="-mt-px size-1 rounded-full bg-brand not-italic" /> : null}
            </button>
          );
        })}
      </div>

      <DayHeading day={anchor} now={now} count={rows.length} pending={props.loading || props.error} />

      {props.loading ? (
        <MobileScheduleSkeleton />
      ) : props.error ? (
        <ScheduleError onRetry={() => props.onRetry?.()} />
      ) : rows.length ? (
        <Timeline {...props} rows={rows} />
      ) : (
        <section className="flex flex-col items-center rounded-xl bg-surface px-6 pt-7 pb-7 text-center">
          <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
            <Icon name="schedule" size={30} />
          </span>
          <strong className="mt-2.5 font-heading text-title text-ink">{t("schedule.emptyDay").replace(/\.$/, "")}</strong>
          <p className="mt-3.5 text-body-sm text-ink-secondary">
            {onCreate ? t("mobileSchedule.emptyHint") : t("schedule.emptyStudentHint")}
          </p>
          {onCreate ? (
            <button
              type="button"
              className="mt-3 flex h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-button text-on-action"
              onClick={onCreate}
            >
              <Icon name="add" size={18} />
              {t("schedule.addLesson")}
            </button>
          ) : null}
        </section>
      )}
    </>
  );
}

function Timeline({ rows, now, courseLook, onSelect, onChat, onJoin, student = false }: MobileScheduleProps & { rows: Lesson[] }) {
  const { t } = useTranslation("lesson");
  const upcoming = rows.find((lesson) => lesson.status === "live") ??
    rows.find((lesson) => lesson.status !== "finished" && new Date(lesson.startsAt).getTime() >= now.getTime());

  return (
    <div className="mt-1 flex flex-col">
      {rows.map((lesson, index) => {
        const live = lesson.status === "live";
        const finished = lesson.status === "finished" || (!live && endOf(lesson).getTime() < now.getTime());
        const minutes = Math.round((new Date(lesson.startsAt).getTime() - now.getTime()) / 60_000);
        const highlight = upcoming?.id === lesson.id && (live || minutes <= SOON_MINUTES);
        const look = courseLook(lesson.courseId);
        const last = index === rows.length - 1;

        return (
          <div key={lesson.id} className="flex">
            <span className="flex w-11.5 shrink-0 flex-col pt-2.5">
              <strong
                className={`text-title-sm ${highlight ? "text-brand" : finished ? "text-ink-secondary" : "text-ink"}`}
              >
                {clock(lesson.startsAt)}
              </strong>
              <small className={`text-caption ${finished ? "text-ink-tertiary" : "text-ink-secondary"}`}>
                {clock(endOf(lesson))}
              </small>
            </span>

            <span className="relative flex w-5.5 shrink-0 justify-center">
              {last ? null : <i className="absolute top-6 -bottom-2 w-0.5 bg-line not-italic" />}
              <i
                className={`relative mt-4 rounded-full not-italic ${
                  highlight
                    ? "size-2 bg-brand ring-[3px] ring-brand-subtle"
                    : finished
                      ? "size-2.5 bg-line-strong"
                      : "size-2.5 bg-brand/60"
                }`}
              />
            </span>

            {highlight ? (
              <button
                type="button"
                className="mb-2 ml-1.5 flex min-w-0 flex-1 flex-col rounded-xl bg-brand p-4 text-left text-on-action"
                onClick={() => onSelect(lesson)}
              >
                <span className="flex h-6 w-fit items-center gap-1.5 rounded-full bg-on-brand-subtle px-2.5 text-caption-strong">
                  <Icon name="schedule" size={16} />
                  {live ? t("schedule.live") : t("schedule.startsIn", { count: Math.max(minutes, 0) })}
                </span>
                <strong className="mt-2.5 w-full truncate font-heading text-[20px]/[26px]">{lesson.courseTitle}</strong>
                <small className="mt-0.5 w-full truncate text-body-sm text-on-action/85">
                  {student
                    ? t("schedule.teacherDuration", { teacher: look.teacher, count: lesson.durationMinutes || 45 })
                    : t("mobileSchedule.studentsAndDuration", {
                        count: look.students,
                        minutes: lesson.durationMinutes || 45,
                      })}
                </small>
                <span
                  role="button"
                  tabIndex={0}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-surface text-button text-ink"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (student) onJoin(lesson);
                    else onChat(lesson);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.stopPropagation();
                      if (student) onJoin(lesson);
                      else onChat(lesson);
                    }
                  }}
                >
                  <Icon name={student ? "videocam-fill" : "chat"} size={20} />
                  {student ? t("schedule.join") : t("schedule.openChat")}
                </span>
              </button>
            ) : (
              <button
                type="button"
                className={`relative mb-2 ml-1.5 flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-surface px-3 py-3 text-left ${
                  finished ? "opacity-60" : ""
                }`}
                onClick={() => onSelect(lesson)}
              >
                <span className="flex w-11 shrink-0 flex-col">
                  <strong className={`text-title-sm ${finished ? "text-ink-secondary" : "text-ink"}`}>
                    {clock(lesson.startsAt)}
                  </strong>
                  <small className="text-caption text-ink-secondary">{clock(endOf(lesson))}</small>
                </span>
                <GroupTile
                  name={lesson.courseTitle}
                  tone={look.tone}
                  src={look.image}
                  className="size-11 rounded-xl"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong className={`truncate pr-6 text-title ${finished ? "text-ink-secondary" : "text-ink"}`}>
                    {lesson.courseTitle}
                  </strong>
                  <LessonMeta lesson={lesson} finished={finished} look={look} student={student} />
                </span>
                <Icon
                  name="chevron-right"
                  size={20}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-icon-secondary"
                />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LessonMeta({
  lesson,
  finished,
  live = false,
  look,
  student,
}: {
  lesson: Lesson;
  finished: boolean;
  live?: boolean;
  look: CourseLook;
  student: boolean;
}) {
  const { t } = useTranslation("lesson");
  const students = look.students;
  if (live)
    return (
      <small className="flex items-center gap-1.5 truncate text-body-sm text-danger">
        <i className="size-2 shrink-0 rounded-full bg-danger not-italic" />
        {t("schedule.live")}
      </small>
    );
  if (lesson.status === "cancelled")
    return (
      <small className="truncate text-body-sm text-danger">
        {student ? look.teacher : t("schedule.students", { count: students })} · {t("schedule.cancelled")}
      </small>
    );
  if (finished)
    return (
      <small className="flex items-center gap-1 truncate text-body-sm text-success-fg">
        <Icon name="check" size={16} className="shrink-0" />
        {student ? t("schedule.finishedBy", { teacher: look.teacher }) : t("mobileSchedule.finished", { count: students })}
      </small>
    );
  return (
    <small className="truncate text-body-sm text-ink-secondary">
      {student ? look.teacher : t("schedule.students", { count: students })}
    </small>
  );
}

function LessonRows({
  rows,
  now,
  courseLook,
  onSelect,
  onJoin,
  student = false,
}: Pick<MobileScheduleProps, "now" | "courseLook" | "onSelect" | "onJoin" | "student"> & { rows: Lesson[] }) {
  const { t } = useTranslation("lesson");
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface">
      {rows.map((lesson) => {
        const live = lesson.status === "live";
        const finished = lesson.status === "finished" || (!live && endOf(lesson).getTime() < now.getTime());
        const look = courseLook(lesson.courseId);
        return (
          <div
            key={lesson.id}
            role="button"
            tabIndex={0}
            className={`flex items-center gap-3 border-b border-line px-4 py-4 text-left last:border-b-0 ${
              live ? "bg-brand-subtle" : ""
            }`}
            onClick={() => onSelect(lesson)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSelect(lesson);
            }}
          >
            <span className="flex w-11 shrink-0 flex-col">
              <strong
                className={`text-title-sm ${live ? "text-brand" : finished ? "text-ink-secondary" : "text-ink"}`}
              >
                {clock(lesson.startsAt)}
              </strong>
              <small className="text-caption text-ink-secondary">{clock(endOf(lesson))}</small>
            </span>
            <GroupTile name={lesson.courseTitle} tone={look.tone} src={look.image} className="size-11 rounded-xl" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong className={`truncate text-title ${finished ? "text-ink-secondary" : "text-ink"}`}>
                {lesson.courseTitle}
              </strong>
              <LessonMeta lesson={lesson} finished={finished} live={live} look={look} student={student} />
            </span>
            {live ? (
              <button
                type="button"
                className="flex h-9 shrink-0 items-center rounded-full bg-brand px-4 text-button text-on-action"
                onClick={(event) => {
                  event.stopPropagation();
                  onJoin(lesson);
                }}
              >
                {t("mobileSchedule.enter")}
              </button>
            ) : (
              <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekView(props: MobileScheduleProps) {
  const { t } = useTranslation("lesson");
  const { anchor, now, lessons, onView, onAnchor, onCreate } = props;
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];
  const months = t("list.months", { returnObjects: true }) as string[];
  const start = startOfWeek(anchor, WEEK_OPTIONS);
  const end = endOfWeek(anchor, WEEK_OPTIONS);
  const week = lessons
    .filter((lesson) => isWithinInterval(new Date(lesson.startsAt), { start, end }))
    .sort(byStart);
  const minutes = week.reduce((sum, lesson) => sum + (lesson.durationMinutes || 45), 0);
  const finished = week.filter((lesson) => lesson.status === "finished").length;
  const current = isWithinInterval(now, { start, end });
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))
    .filter((day) => !current || day >= startOfDay(now))
    .map((day) => ({ day, rows: onDay(week, day) }))
    .filter((entry) => entry.rows.length);

  const stats = [
    { id: "lessons", value: String(week.length), label: t("mobileSchedule.statLessons") },
    { id: "hours", value: t("mobileSchedule.hoursShort", { count: Math.round(minutes / 60) }), label: t("mobileSchedule.statHours") },
    { id: "finished", value: String(finished), label: t("mobileSchedule.statFinished") },
  ];

  return (
    <>
      <section className="flex flex-col gap-3 rounded-xl bg-brand p-4 text-on-action">
        <span className="flex items-center justify-between gap-3">
          <span className="flex h-6 items-center gap-1.5 rounded-full bg-on-brand-subtle px-2.5 text-caption-strong">
            <Icon name="bar-chart" size={16} />
            {t("mobileSchedule.thisWeek")}
          </span>
          <button
            type="button"
            className="text-caption-strong"
            onClick={() => {
              onAnchor(new Date(now));
              onView("day");
            }}
          >
            {t("mobileSchedule.more")}
          </button>
        </span>
        <span className="grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <span key={stat.id} className="flex h-15.5 flex-col rounded-lg bg-on-brand-subtle px-3 pt-2.5">
              <strong className="text-[20px]/[26px] font-semibold">{stat.value}</strong>
              <small className="mt-0.5 text-caption">{stat.label}</small>
            </span>
          ))}
        </span>
      </section>

      {days.length ? (
        days.map(({ day, rows }) => (
          <section key={day.toISOString()} className="flex flex-col gap-2">
            <span className="flex items-center gap-3 text-caption-strong text-ink-secondary uppercase">
              <span className="min-w-0 flex-1 truncate">
                {weekdaysLong[(day.getDay() + 6) % 7]}, {day.getDate()}-{months[day.getMonth()]}
                {isSameDay(day, now) ? ` · ${t("schedule.today")}` : ""}
              </span>
              <span className="shrink-0 font-normal normal-case">{t("schedule.lessonCountShort", { count: rows.length })}</span>
            </span>
            <LessonRows {...props} rows={rows} />
          </section>
        ))
      ) : (
        <section className="flex flex-col items-center rounded-xl bg-surface px-6 py-7 text-center">
          <strong className="font-heading text-title-lg text-ink">{t("schedule.emptyWeek")}</strong>
          <p className="mt-3 text-body-sm text-ink-secondary">
            {onCreate ? t("mobileSchedule.emptyHint") : t("schedule.emptyStudentHint")}
          </p>
          {onCreate ? (
            <button
              type="button"
              className="mt-4 flex h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-button text-on-action"
              onClick={onCreate}
            >
              <Icon name="add" size={18} />
              {t("schedule.addLesson")}
            </button>
          ) : null}
        </section>
      )}
    </>
  );
}

function MonthView(props: MobileScheduleProps) {
  const { t } = useTranslation("lesson");
  const { anchor, lessons, onAnchor } = props;
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const monthsLong = t("list.monthsLong", { returnObjects: true }) as string[];
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];
  const gridStart = startOfWeek(startOfMonth(anchor), WEEK_OPTIONS);
  const gridEnd = endOfWeek(endOfMonth(anchor), WEEK_OPTIONS);
  const cells: Date[] = [];
  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) cells.push(day);
  const rows = onDay(lessons, anchor);

  return (
    <>
      <section className="flex flex-col rounded-xl bg-surface px-4 pt-4 pb-4.5">
        <span className="flex items-center gap-3">
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink"
            aria-label={t("schedule.prev")}
            onClick={() => onAnchor(startOfMonth(addMonths(anchor, -1)))}
          >
            <Icon name="chevron-left" size={22} />
          </button>
          <strong className="min-w-0 flex-1 truncate text-center font-heading text-title">
            {monthsLong[anchor.getMonth()]} {anchor.getFullYear()}
          </strong>
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink"
            aria-label={t("schedule.next")}
            onClick={() => onAnchor(startOfMonth(addMonths(anchor, 1)))}
          >
            <Icon name="chevron-right" size={22} />
          </button>
        </span>
        <span className="mt-0.5 grid grid-cols-7 text-center text-caption text-ink-secondary">
          {weekdays.map((day) => (
            <span key={day} className="py-1">
              {day}
            </span>
          ))}
        </span>
        <span className="grid grid-cols-7 gap-y-1.5">
          {cells.map((day, index) => {
            const inMonth = isSameMonth(day, anchor);
            const active = isSameDay(day, anchor);
            const has = inMonth && lessons.some((lesson) => isSameDay(new Date(lesson.startsAt), day));
            const muted = !inMonth || index % 7 === 6;
            return (
              <button
                key={day.toISOString()}
                type="button"
                aria-pressed={active}
                className="flex justify-center"
                onClick={() => onAnchor(day)}
              >
                <span
                  className={`flex size-11 flex-col items-center justify-center rounded-lg text-body-sm font-medium ${
                    active ? "bg-brand text-on-action" : muted ? "text-ink-disabled" : "text-ink"
                  }`}
                >
                  {day.getDate()}
                  <i
                    className={`size-1 rounded-full not-italic ${
                      has ? (active ? "bg-on-action" : "bg-brand") : "bg-transparent"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </span>
      </section>

      <div className="flex items-center gap-3">
        <h2 className="min-w-0 flex-1 truncate font-heading text-title text-ink">
          {anchor.getDate()}-{(monthsLong[anchor.getMonth()] ?? "").toLowerCase()}, {weekdaysLong[(anchor.getDay() + 6) % 7]}
        </h2>
        <small className="shrink-0 text-body-sm text-ink-secondary">
          {rows.length ? t("schedule.lessonCount", { count: rows.length }) : t("schedule.noLessonsDay")}
        </small>
      </div>

      {rows.length ? <LessonRows {...props} rows={rows} /> : null}
    </>
  );
}
