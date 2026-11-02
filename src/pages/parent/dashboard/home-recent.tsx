import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { LessonOutcome } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import type { Lesson } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { clock, hoursMinutes, lessonEnd } from "./home-format";

const TILE: Record<string, string> = {
  upcoming: "bg-accent-teal-bg text-accent-teal-fg",
  live: "bg-danger-bg text-error-text",
  attended: "bg-accent-green-bg text-accent-green-fg",
  late: "bg-accent-saffron-bg text-accent-saffron-fg",
  missed: "bg-danger-bg text-error-text",
};

export function HomeRecent({ items, now }: { items: Array<{ lesson: Lesson; outcome: LessonOutcome }>; now: number }) {
  const { t } = useTranslation("parent");
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <strong className="flex-1 text-title text-ink">{t("home.recent.title")}</strong>
        <Link to={ROUTES.parent.attendance} className="text-body-sm font-medium text-brand hover:opacity-80">
          {t("home.recent.all")}
        </Link>
      </div>
      <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
        {items.length ? (
          items.map(({ lesson, outcome }) => {
            const key =
              outcome.kind === "attended" ? (outcome.lateMinutes ? "late" : "attended") : outcome.kind;
            const date = new Date(lesson.startsAt);
            const from = clock(lesson.startsAt);
            const to = clock(lessonEnd(lesson));
            let meta: string;
            let chip: React.ReactNode;
            if (outcome.kind === "upcoming") {
              meta = t("home.recent.today", { from, to });
              chip = (
                <span className="flex items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
                  <Icon name="schedule" size={14} />
                  {from}
                </span>
              );
            } else if (outcome.kind === "live") {
              meta = outcome.row?.joinedAt
                ? t("home.recent.liveSince", {
                    time: clock(outcome.row.joinedAt),
                    minutes: Math.max(0, Math.floor((now - Date.parse(outcome.row.joinedAt)) / 60_000)),
                  })
                : t("home.recent.liveNotJoined");
              chip = (
                <span className="flex items-center gap-1.5 rounded-full bg-danger-bg px-2.5 py-1 text-caption-strong text-error-text">
                  <span className="size-2 rounded-full bg-danger" />
                  {t("home.recent.chipLive")}
                </span>
              );
            } else if (outcome.kind === "attended") {
              meta = t("home.recent.stay", {
                from: clock(outcome.row.joinedAt ?? lesson.startsAt),
                to: clock(outcome.row.leftAt ?? lessonEnd(lesson)),
                duration: hoursMinutes(outcome.row.minutes ?? 0, t, "home.recent"),
              });
              chip = outcome.lateMinutes ? (
                <span className="flex items-center gap-1 rounded-full bg-warning-bg px-2.5 py-1 text-caption-strong text-warning-fg">
                  <Icon name="schedule" size={14} />
                  {t("home.recent.chipLate", { count: outcome.lateMinutes })}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-caption-strong text-success-fg">
                  <Icon name="check-circle" size={14} />
                  {t("home.recent.chipAttended")}
                </span>
              );
            } else {
              meta = t("home.recent.missed", { from, to });
              chip = (
                <span className="rounded-full bg-danger-bg px-2.5 py-1 text-caption-strong text-error-text">
                  {t("home.recent.chipMissed")}
                </span>
              );
            }
            return (
              <li key={lesson.id} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-b-0">
                <span className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-xl ${TILE[key]}`}>
                  <strong className="font-heading text-title leading-5">{date.getDate()}</strong>
                  <small className="text-[11px] leading-3 font-semibold">{formatLocalized(date, "LLL").replace(".", "")}</small>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong className="truncate text-body font-semibold text-ink">{lesson.courseTitle}</strong>
                  <small className="truncate text-body-xs text-ink-secondary">{meta}</small>
                </span>
                {chip}
              </li>
            );
          })
        ) : (
          <li className="px-4 py-8 text-center text-body-sm text-ink-secondary">{t("home.recent.empty")}</li>
        )}
      </ul>
    </section>
  );
}
