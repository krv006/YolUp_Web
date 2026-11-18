import { useTranslation } from "react-i18next";
import type { HomeworkFocus } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";

const VISIBLE_ROWS = 5;

function clock(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function useDuration() {
  const { t } = useTranslation("homework");
  return (total: number) => {
    const seconds = Math.max(0, Math.round(total));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    if (hours) return t("reviewFocus.hours", { hours, minutes });
    if (minutes) return rest ? t("reviewFocus.minutesSeconds", { minutes, seconds: rest }) : t("reviewFocus.minutes", { minutes });
    return t("reviewFocus.seconds", { seconds: rest });
  };
}

export function HomeworkFocusCard({ focus }: { focus: HomeworkFocus }) {
  const { t } = useTranslation("homework");
  const duration = useDuration();
  const left = focus.exits > 0;
  const rows = focus.timeline.slice(0, VISIBLE_ROWS);
  const hidden = focus.timeline.length - rows.length;

  return (
    <section className="flex flex-col gap-2.5 rounded-xl bg-subtle/60 p-4">
      <span className="flex items-center gap-2">
        <Icon name="visibility" size={18} className="shrink-0 text-ink-secondary" />
        <strong className="flex-1 text-body-sm font-semibold text-ink">{t("reviewFocus.title")}</strong>
        <span
          className={`flex h-6 shrink-0 items-center rounded-full px-2.5 text-caption-strong ${
            left ? "bg-warning-bg text-warning-fg" : "bg-success-bg text-success-fg"
          }`}
        >
          {left ? t("reviewFocus.exits", { count: focus.exits }) : t("reviewFocus.stayed")}
        </span>
      </span>
      <small className="text-caption text-ink-secondary">
        {left
          ? t("reviewFocus.away", { total: duration(focus.awaySeconds), longest: duration(focus.longestSeconds) })
          : t("reviewFocus.stayedHint")}
      </small>
      {rows.length ? (
        <ul className="flex flex-col gap-1">
          {rows.map((row) => (
            <li key={row.leftAt} className="flex items-center justify-between gap-3 text-caption text-ink">
              <span className="font-numeric">
                {clock(row.leftAt)} → {row.returnedAt ? clock(row.returnedAt) : t("reviewFocus.notReturned")}
              </span>
              <span className="font-numeric text-ink-secondary">{duration(row.seconds)}</span>
            </li>
          ))}
          {hidden > 0 ? <li className="text-caption text-ink-tertiary">{t("reviewFocus.more", { count: hidden })}</li> : null}
        </ul>
      ) : null}
    </section>
  );
}
