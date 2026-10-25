import { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import type { QuizAttemptSummary } from "@/shared/types";

export interface QuizAttemptsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  attempts: readonly QuizAttemptSummary[];
  studentCount?: number;
  loading?: boolean;
}

interface StudentRow {
  id: string;
  name: string;
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
  studentCount = 0,
  loading = false,
}: QuizAttemptsDrawerProps) {
  const { t } = useTranslation("quiz");
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
