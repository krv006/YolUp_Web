import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { parentHome, type HeroState, type WeekSummary } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import type { AttendanceRow } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { clock, lessonEnd } from "./home-format";

export interface HomeHeroProps {
  childName: string;
  hero: HeroState;
  week: WeekSummary;
  todayCount: number;
  teachers: Map<string, string>;
  now: number;
  compact?: boolean;
}

export function HomeHero({ childName, hero, week, todayCount, teachers, now, compact = false }: HomeHeroProps) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const first = childName.split(" ")[0] || childName;

  let chip: { label: string; live?: boolean };
  let title: string;
  let meta: string;
  let action: string;
  let liveRow: AttendanceRow | null = null;

  if (hero.kind === "live") {
    const minutes = Math.max(0, Math.floor((now - Date.parse(hero.lesson.startsAt)) / 60_000));
    chip = { label: t("home.hero.liveChip", { count: minutes }), live: true };
    title = hero.row ? t("home.hero.liveTitle", { name: first }) : t("home.hero.liveNotJoined", { name: first });
    meta = [
      hero.lesson.courseTitle,
      hero.row?.joinedAt ? t("home.hero.joinedAt", { time: clock(hero.row.joinedAt) }) : `${clock(hero.lesson.startsAt)} – ${clock(lessonEnd(hero.lesson))}`,
      teachers.get(hero.lesson.courseId),
    ]
      .filter(Boolean)
      .join(" · ");
    action = t("home.hero.lessonDetails");
    liveRow = hero.row;
  } else if (hero.kind === "today") {
    chip = { label: t("home.hero.todayChip", { time: clock(hero.focus.startsAt) }) };
    title = t("home.hero.todayTitle", { name: first, count: todayCount });
    meta = [
      hero.focus.courseTitle,
      `${clock(hero.focus.startsAt)} – ${clock(lessonEnd(hero.focus))}`,
      teachers.get(hero.focus.courseId),
    ]
      .filter(Boolean)
      .join(" · ");
    action = t("home.hero.viewAttendance");
  } else {
    chip = { label: t("home.hero.freeChip") };
    title = t("home.hero.freeTitle", { name: first });
    meta = hero.next
      ? t("home.hero.nextLesson", {
          day: formatLocalized(hero.next.startsAt, t("home.dayPattern")),
          time: clock(hero.next.startsAt),
          course: hero.next.courseTitle,
        })
      : t("home.hero.noUpcoming");
    action = t("home.hero.viewAttendance");
  }

  const focus = liveRow ? parentHome.liveFocusPercent(liveRow, now) : null;
  const chipNode = (
    <span
      className={`flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-caption-strong ${
        chip.live ? "bg-surface text-error-text" : "bg-on-brand-subtle"
      }`}
    >
      {chip.live ? <span className="size-2 rounded-full bg-danger" /> : <Icon name="schedule" size={14} />}
      {chip.label}
    </span>
  );

  if (compact)
    return (
      <section className="relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-brand px-5 py-5 text-on-action">
        <span className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-on-brand-subtle" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-10 -left-12 size-28 rounded-full bg-on-brand-subtle" aria-hidden="true" />
        <div className="relative flex flex-col gap-2">
          {chipNode}
          <h2 className="font-heading text-[20px]/7 font-semibold text-balance">{title}</h2>
          <p className="text-body-sm opacity-85">{meta}</p>
        </div>
        <div className="relative">
          {liveRow ? <LiveFocus row={liveRow} focus={focus} compact /> : <WeekStrip week={week} now={now} compact />}
        </div>
        <div className="relative flex items-center gap-3">
          <small className="min-w-0 flex-1 text-body-sm opacity-90">
            {liveRow?.joinedAt
              ? t("mobile.hero.joined", { time: clock(liveRow.joinedAt) })
              : t("home.hero.weekSummary", { attended: week.attended, total: week.total })}
          </small>
          <button
            type="button"
            className="flex h-11 shrink-0 items-center rounded-full bg-surface px-4 text-button text-ink transition-opacity hover:opacity-90"
            onClick={() => navigate(ROUTES.parent.attendance)}
          >
            {liveRow ? t("mobile.hero.watch") : t("mobile.hero.details")}
          </button>
        </div>
      </section>
    );

  return (
    <section className="relative flex min-h-48 overflow-hidden rounded-3xl bg-brand px-7 py-6 text-on-action">
      <span className="pointer-events-none absolute -bottom-36 -left-16 size-72 rounded-full bg-on-brand-subtle" aria-hidden="true" />
      <div className="relative flex min-w-0 flex-1 flex-col items-start gap-2">
        {chipNode}
        <h2 className="mt-1 font-heading text-[20px]/7 font-semibold text-balance">{title}</h2>
        <p className="text-body-sm opacity-85">{meta}</p>
        <button
          type="button"
          className="mt-3 flex h-11 items-center rounded-full bg-surface px-4 text-button text-ink transition-opacity hover:opacity-90"
          onClick={() => navigate(ROUTES.parent.attendance)}
        >
          {action}
        </button>
      </div>

      <div className="relative ml-6 flex w-[310px] shrink-0 flex-col justify-center gap-3">
        {liveRow ? <LiveFocus row={liveRow} focus={focus} /> : <WeekStrip week={week} now={now} />}
      </div>
    </section>
  );
}

function LiveFocus({ row, focus, compact = false }: { row: AttendanceRow; focus: number | null; compact?: boolean }) {
  const { t } = useTranslation("parent");
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-on-brand-subtle px-4 py-4">
      <span className="flex items-center justify-between text-body-sm">
        {t("home.hero.focusTitle")}
        <strong className="text-title">{focus === null ? "—" : `${focus}%`}</strong>
      </span>
      <span className="h-2 overflow-hidden rounded-full bg-on-brand-subtle">
        <span className="block h-full rounded-full bg-success" style={{ width: `${focus ?? 0}%` }} />
      </span>
      {compact ? null : <small className="text-caption opacity-85">
        {focus === null && !row.attentionTotal
          ? t("home.hero.focusPending")
          : row.attentionTotal
            ? t("home.hero.focusMeta", { time: clock(row.joinedAt ?? ""), answered: row.attentionAnswered, total: row.attentionTotal })
            : t("home.hero.focusMetaNoChecks", { time: clock(row.joinedAt ?? "") })}
      </small>}
    </div>
  );
}

const DOT: Record<string, string> = {
  attended: "bg-success text-on-action",
  late: "bg-saffron text-on-action",
  missed: "bg-danger text-on-action",
  today: "border-2 border-dashed border-on-action/60",
  none: "bg-on-brand-subtle",
};

function WeekStrip({ week, now, compact = false }: { week: WeekSummary; now: number; compact?: boolean }) {
  const { t } = useTranslation("parent");
  const labels = t("home.hero.weekdays", { returnObjects: true }) as string[];
  const today = new Date(now).toDateString();
  return (
    <>
      <div className="grid grid-cols-7 gap-1.5 rounded-2xl bg-on-brand-subtle px-3 py-3">
        {week.days.map((day, index) => (
          <span key={day.date.toISOString()} className="flex flex-col items-center gap-2">
            <small className={`text-caption ${day.date.toDateString() === today ? "font-semibold" : "opacity-85"}`}>
              {labels[index]}
            </small>
            <span
              className={`grid size-8 place-items-center rounded-full ${DOT[day.state]}`}
              title={t(`home.hero.dayState.${day.state}`)}
            >
              {day.state === "attended" ? <Icon name="check" size={16} /> : null}
              {day.state === "late" ? <Icon name="schedule" size={16} /> : null}
              {day.state === "missed" ? <Icon name="close" size={16} /> : null}
              {day.state === "today" ? <span className="size-1.5 rounded-full bg-on-action/70" /> : null}
            </span>
          </span>
        ))}
      </div>
      {compact ? null : (
        <small className="text-right text-caption opacity-85">
          {t("home.hero.weekSummary", { attended: week.attended, total: week.total })}
          {week.late ? t("home.hero.weekLate", { count: week.late }) : ""}
        </small>
      )}
    </>
  );
}
