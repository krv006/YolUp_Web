import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Lesson } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";

export interface DashboardHeroProps {
  lesson: Lesson;
  live: boolean;
  studentCount: number;
  hasQuiz: boolean;
  joinedCount?: number | null;
  onOpen: () => void;
  onChat: () => void;
}

const TICK_MS = 30_000;

function clock(value: Date): string {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

export function DashboardHero({
  lesson,
  live,
  studentCount,
  hasQuiz,
  joinedCount = null,
  onOpen,
  onChat,
}: DashboardHeroProps) {
  const { t } = useTranslation("dashboard");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setNow(Date.now()), TICK_MS);
    return () => globalThis.clearTimeout(timer);
  }, [now]);

  const start = new Date(lesson.startsAt);
  const end = new Date(start.getTime() + (lesson.durationMinutes || 45) * 60000);
  const minutesToStart = Math.round((start.getTime() - now) / 60000);
  const minutesLive = Math.max(0, Math.round((now - start.getTime()) / 60000));

  return (
    <section className="flex flex-wrap items-center gap-5 rounded-xl bg-brand-gradient px-7 py-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-on-brand-subtle px-3 py-1.5 text-caption-strong text-ink-inverse">
          {live ? (
            <>
              <span className="size-2 rounded-full bg-accent-red-fg" />
              {t("hero.live", { count: minutesLive })}
            </>
          ) : (
            <>
              <Icon name="clock" size={14} />
              {minutesToStart <= 0
                ? t("hero.startsNow")
                : minutesToStart < 60
                  ? t("hero.startsIn", { count: minutesToStart })
                  : t("hero.startsInHours", { count: Math.round(minutesToStart / 60) })}
            </>
          )}
        </span>

        <h2 className="font-heading text-h1 text-ink-inverse">
          {lesson.title ? `${lesson.courseTitle} — ${lesson.title}` : lesson.courseTitle}
        </h2>

        <p className="text-body-sm text-ink-inverse-secondary">
          {live && joinedCount !== null
            ? t("hero.joined", { done: joinedCount, total: studentCount })
            : null}
          {live && joinedCount !== null ? " · " : ""}
          {clock(start)} – {clock(end)}
          {!live ? ` · ${t("hero.students", { count: studentCount })}` : ""}
          {!live && hasQuiz ? ` · ${t("hero.quizAttached")}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="flex h-12 items-center rounded-full bg-surface px-6 text-button text-brand transition-opacity hover:opacity-90"
          onClick={onOpen}
        >
          {live ? t("hero.join") : t("hero.start")}
        </button>
        <button
          type="button"
          className="flex h-12 items-center rounded-full px-5 text-button text-ink-inverse transition-colors hover:bg-on-brand-subtle"
          onClick={onChat}
        >
          {t("hero.chat")}
        </button>
      </div>
    </section>
  );
}
