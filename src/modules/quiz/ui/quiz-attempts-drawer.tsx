import { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { MobileScreenDialog } from "@/shared/ui/mobile-screen-dialog";
import type { QuizAttemptSummary } from "@/shared/types";

export interface QuizAttemptsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  attempts: readonly QuizAttemptSummary[];
  students?: ReadonlyArray<{ id: string; name: string; avatarUrl?: string | null }>;
  studentCount?: number;
  loading?: boolean;
}

interface StudentRow {
  id: string;
  name: string;
  avatarUrl?: string | null;
  attempts: QuizAttemptSummary[];
  best: number | null;
  last: string | null;
}

function percent(attempt: QuizAttemptSummary): number | null {
  return attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : null;
}

function tone(value: number | null): string {
  if (value === null) return "text-ink-tertiary";
  if (value >= 85) return "text-success-fg";
  if (value >= 70) return "text-brand";
  return "text-warning-fg";
}

export function QuizAttemptsDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  attempts,
  students = [],
  studentCount = 0,
  loading = false,
}: QuizAttemptsDrawerProps) {
  const { t } = useTranslation("quiz");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const isCompact = useIsCompact();
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo<StudentRow[]>(() => {
    const map = new Map<string, StudentRow>();
    for (const attempt of attempts) {
      const current = map.get(attempt.studentId) ?? {
        id: attempt.studentId,
        name: attempt.studentName,
        attempts: [],
        best: null,
        last: null,
      };
      const value = percent(attempt);
      current.attempts.push(attempt);
      current.best = current.best === null ? value : Math.max(current.best, value ?? 0);
      current.last =
        !current.last || attempt.createdAt > current.last ? attempt.createdAt : current.last;
      map.set(attempt.studentId, current);
    }
    return [...map.values()].sort((a, b) => (b.best ?? -1) - (a.best ?? -1));
  }, [attempts]);

  const average = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + (row.best ?? 0), 0) / rows.length)
    : null;

  if (isCompact) {
    const listed = [
      ...rows.map((row) => ({ ...row, avatarUrl: students.find((item) => item.id === row.id)?.avatarUrl })),
      ...students
        .filter((student) => !rows.some((row) => row.id === student.id))
        .map((student) => ({ id: student.id, name: student.name, avatarUrl: student.avatarUrl, attempts: [], best: null, last: null })),
    ];
    const detail = listed.find((row) => row.id === expanded && row.attempts.length) ?? null;
    const dateLabel = (value: string, withTime: boolean) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const clock = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      const day = `${date.getDate()}-${(months[date.getMonth()] ?? "").slice(0, 3).toLowerCase()}`;
      return withTime ? `${day}, ${clock}` : day;
    };
    const lastLabel = (value: string) => {
      const date = new Date(value);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (date.toDateString() === today.toDateString())
        return t("attemptsDrawer.lastToday", { time: dateLabel(value, true).split(", ")[1] ?? "" });
      if (date.toDateString() === yesterday.toDateString()) return t("attemptsDrawer.yesterday");
      return dateLabel(value, false);
    };

    return (
      <MobileScreenDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("attemptsDrawer.title")}
        closeLabel={t("attemptsDrawer.close")}
      >
        <p className="mt-4.5 text-label-lg font-normal text-ink-secondary">
          {subtitle ? `“${title}” · ${subtitle}` : `“${title}”`}
        </p>

        <div className="mt-[11px] grid grid-cols-3 gap-2">
          {[
            { id: "attempts", value: String(attempts.length), label: t("attemptsDrawer.attempts") },
            { id: "average", value: average === null ? "—" : `${average}%`, label: t("attemptsDrawer.average") },
            {
              id: "solved",
              value: `${rows.length}/${Math.max(studentCount, listed.length, rows.length)}`,
              label: t("attemptsDrawer.solved"),
            },
          ].map((stat) => (
            <div key={stat.id} className="flex h-16.5 min-w-0 flex-col justify-center rounded-lg bg-surface px-3">
              <strong className="truncate font-heading text-title-lg text-ink">{stat.value}</strong>
              <small className="truncate text-body-xs text-ink-secondary">{stat.label}</small>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-surface motion-reduce:animate-none" />
            ))}
          </div>
        ) : listed.length ? (
          <div className="mt-3 flex flex-col gap-[30px] rounded-xl bg-surface px-4 pt-4 pb-3">
            {listed.map((row) => (
              <button
                key={row.id}
                type="button"
                className="flex h-10 items-center gap-3 text-left"
                aria-expanded={expanded === row.id}
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
              >
                <Avatar name={row.name} src={row.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-9" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title-sm text-ink">{row.name}</strong>
                  <small className="truncate text-caption font-normal text-ink-secondary">
                    {row.attempts.length
                      ? [t("attemptsDrawer.attemptCount", { count: row.attempts.length }), row.last ? lastLabel(row.last) : ""]
                          .filter(Boolean)
                          .join(" · ")
                      : t("attemptsDrawer.noAttempts")}
                  </small>
                </span>
                {row.best === null ? (
                  <span className="h-0.5 w-3.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                ) : (
                  <strong className={`shrink-0 text-title ${row.best >= 90 ? "text-success" : row.best >= 70 ? "text-ink" : "text-warning-fg"}`}>
                    {row.best}%
                  </strong>
                )}
                <Icon
                  name="chevron-down"
                  size={20}
                  className={`shrink-0 text-icon-secondary transition-transform ${expanded === row.id ? "rotate-180" : ""}`}
                />
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-surface px-5 py-10 text-center text-body-sm text-ink-secondary">
            {t("attemptsDrawer.empty")}
          </p>
        )}

        {detail ? (
          <section className="mt-6 flex flex-col px-3">
            <strong className="text-title-sm text-ink">{t("attemptsDrawer.detailTitle", { name: detail.name })}</strong>
            <div className="mt-[3px] flex flex-col">
              {[...detail.attempts]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((attempt, index, list) => (
                  <span key={attempt.id} className="flex h-5.5 items-center gap-3 text-caption font-normal">
                    <span className="min-w-0 flex-1 truncate text-ink-secondary">
                      {t("attemptsDrawer.attemptLine", { number: list.length - index })} ·{" "}
                      {dateLabel(attempt.createdAt, true)}
                    </span>
                    <strong className="shrink-0 font-semibold text-ink">
                      {percent(attempt) === null ? "—" : `${percent(attempt)}%`}
                    </strong>
                  </span>
                ))}
            </div>
          </section>
        ) : null}
      </MobileScreenDialog>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-115 flex-col gap-5 bg-surface px-6 py-6 text-ink shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex shrink-0 items-start gap-3">
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <DialogPrimitive.Title className="truncate font-heading text-h1 text-ink">
                {t("attemptsDrawer.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="truncate text-body-sm text-ink-secondary">
                {subtitle ? `${title} · ${subtitle}` : title}
              </DialogPrimitive.Description>
            </span>
            <DialogPrimitive.Close
              className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted"
              aria-label={t("attemptsDrawer.close")}
            >
              <Icon name="close" size={18} />
            </DialogPrimitive.Close>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-3">
            <Stat label={t("attemptsDrawer.attempts")} value={String(attempts.length)} />
            <Stat
              label={t("attemptsDrawer.average")}
              value={average === null ? "—" : `${average}%`}
            />
            <Stat
              label={t("attemptsDrawer.solved")}
              value={`${rows.length}/${studentCount || rows.length}`}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : null}

            {!loading && !rows.length ? (
              <p className="py-10 text-center text-body-sm text-ink-tertiary">
                {t("attemptsDrawer.empty")}
              </p>
            ) : null}

            {rows.map((row) => {
              const openRow = expanded === row.id;
              return (
                <div key={row.id} className="flex flex-col">
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-subtle"
                    onClick={() => setExpanded(openRow ? null : row.id)}
                  >
                    <Avatar name={row.name} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm text-ink">{row.name}</strong>
                      <small className="truncate text-body-xs text-ink-tertiary">
                        {t("attemptsDrawer.attemptCount", { count: row.attempts.length })}
                      </small>
                    </span>
                    <strong className={`shrink-0 text-title-sm ${tone(row.best)}`}>
                      {row.best === null ? "—" : `${row.best}%`}
                    </strong>
                    <Icon
                      name="chevron-down"
                      size={18}
                      className={`shrink-0 text-icon-tertiary transition-transform ${
                        openRow ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openRow ? (
                    <div className="flex flex-col gap-1.5 rounded-md bg-subtle px-4 py-3">
                      {row.attempts.map((attempt, index) => (
                        <span key={attempt.id} className="flex items-center gap-3">
                          <small className="min-w-0 flex-1 truncate text-body-xs text-ink-secondary">
                            {t("attemptsDrawer.attemptLine", {
                              number: row.attempts.length - index,
                            })}
                          </small>
                          <small className="shrink-0 text-body-xs text-ink">
                            {percent(attempt) === null ? "—" : `${percent(attempt)}%`}
                          </small>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-surface p-4 shadow-sm">
      <strong className="font-heading text-h1 text-ink">{value}</strong>
      <small className="truncate text-body-xs text-ink-tertiary">{label}</small>
    </div>
  );
}
