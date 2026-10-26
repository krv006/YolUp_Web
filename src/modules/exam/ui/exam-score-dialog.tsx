import { useState } from "react";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ExamStudentResult } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";

export interface ExamScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ExamStudentResult | null;
  pending?: boolean;
  onSave: (scores: Record<string, number>, comment: string) => void;
}

export function ExamScoreDialog({
  open,
  onOpenChange,
  result,
  pending = false,
  onSave,
}: ExamScoreDialogProps) {
  const { t } = useTranslation("exam");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [syncedId, setSyncedId] = useState<string | null>(null);

  if (result && syncedId !== result.studentId) {
    setSyncedId(result.studentId);
    setScores(
      Object.fromEntries(
        result.sections
          .filter((section) => section.manual)
          .map((section) => [section.key, section.score === null ? "" : String(section.score)])
      )
    );
  }

  if (!result) return null;


  const values = result.sections
    .map((section) =>
      section.manual ? Number(scores[section.key] ?? "") : (section.score ?? Number.NaN)
    )
    .filter((value) => Number.isFinite(value)) as number[];
  const overall = values.length
    ? (Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 2) / 2).toFixed(1)
    : "—";

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      width="lg:w-120"
      title={t("mock.scoreTitle", { name: result.studentName })}
      description={t("mock.scoreDescription")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("mock.scoreCancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={pending}
            onClick={() => {
              const payload: Record<string, number> = {};
              for (const [key, value] of Object.entries(scores)) {
                const score = Number(value);
                if (value.trim() && Number.isFinite(score)) payload[key] = score;
              }
              onSave(payload, "");
            }}
          >
            {t("mock.scoreSave")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2.5">
        {result.sections.map((section) => {
          const manual = section.manual;
          const value = manual ? (scores[section.key] ?? "") : "";
          return (
            <label
              key={section.key}
              className={`flex items-center gap-3 rounded-md border-2 px-4 py-3 transition-colors ${
                manual
                  ? "border-transparent bg-subtle focus-within:border-focus focus-within:bg-surface"
                  : "border-transparent bg-subtle"
              }`}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink">{section.title}</strong>
                <small className="truncate text-body-xs text-ink-tertiary">
                  {manual ? t("mock.enterBand") : t("mock.autoScored")}
                </small>
              </span>

              {manual ? (
                <input
                  className="w-16 shrink-0 bg-transparent text-right font-heading text-title-lg text-ink outline-none placeholder:text-ink-tertiary"
                  inputMode="decimal"
                  value={value}
                  placeholder="—"
                  onChange={(event) =>
                    setScores((current) => ({ ...current, [section.key]: event.target.value }))
                  }
                />
              ) : (
                <span className="flex shrink-0 items-center gap-2 text-ink-tertiary">
                  <Lock size={15} />
                  <strong className="font-heading text-title-lg text-ink">
                    {section.score === null ? "—" : section.score}
                  </strong>
                </span>
              )}
            </label>
          );
        })}

        <span className="flex items-center gap-3 px-1 pt-1">
          <small className="min-w-0 flex-1 truncate text-body-sm text-ink-secondary">
            {t("mock.overallBand")}
          </small>
          <strong className="shrink-0 font-heading text-h2 text-brand">{overall}</strong>
        </span>
      </div>
    </AppDialog>
  );
}
