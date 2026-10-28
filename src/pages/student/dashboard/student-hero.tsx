import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Lesson } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { lessonClock } from "../lib/clock";

const TICK_MS = 30_000;

export interface StudentHeroProps {
  lesson: Lesson;
  teacher: string;
  joinedCount: number | null;
  onJoin: () => void;
  onDetails: () => void;
  onChat: () => void;
}

export function StudentHero({ lesson, teacher, joinedCount, onJoin, onDetails, onChat }: StudentHeroProps) {
  const { t } = useTranslation("student");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setNow(Date.now()), TICK_MS);
    return () => globalThis.clearTimeout(timer);
  }, [now]);

  const start = new Date(lesson.startsAt);
  const end = new Date(start.getTime() + (lesson.durationMinutes || 45) * 60000);
  const live = lesson.status === "live";
  const today = start.toDateString() === new Date(now).toDateString();
  const minutesToStart = Math.round((start.getTime() - now) / 60000);
  const minutesLive = Math.max(0, Math.round((now - start.getTime()) / 60000));

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
    : [`${lessonClock(start)} – ${lessonClock(end)}`, teacher, t("home.hero.online")];

  return (
    <section className="flex items-center gap-6 rounded-2xl bg-brand-gradient py-6 pr-6 pl-7">
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <span
          className={`flex h-[22px] items-center gap-1.5 rounded-full px-2 text-caption-strong ${
            live ? "bg-danger-bg text-error-text" : "bg-surface text-brand"
          }`}
        >
          {live ? <i className="size-2 rounded-full bg-danger not-italic" /> : <Icon name="timer" size={14} />}
          {badge}
        </span>
        <h2 className="mt-[5px] font-heading text-[24px]/8 font-medium tracking-[-0.02em] text-ink-inverse">
          {lesson.title ? `${lesson.courseTitle} — ${lesson.title}` : lesson.courseTitle}
        </h2>
        <p className="mt-1.5 text-body-sm text-ink-inverse-secondary">{meta.filter(Boolean).join(" · ")}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="flex h-[42px] items-center rounded-full border border-line-strong bg-surface px-[15px] text-button text-ink transition-opacity hover:opacity-90"
          onClick={today ? onJoin : onDetails}
        >
          {today ? t("home.hero.join") : t("home.hero.details")}
        </button>
        <button
          type="button"
          className="flex h-[42px] items-center rounded-full px-5 text-button text-ink-inverse transition-colors hover:bg-on-brand-subtle"
          onClick={onChat}
        >
          {t("home.hero.chat")}
        </button>
      </div>
    </section>
  );
}
