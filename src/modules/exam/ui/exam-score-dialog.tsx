import { useState } from "react";
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
  const [comment, setComment] = useState("");
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
    setComment("");
  }

  if (!result) return null;

  const autoSections = result.sections.filter((section) => !section.manual);
  const manualSections = result.sections.filter((section) => section.manual);

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
              onSave(payload, comment);
            }}
          >
            {t("mock.scoreSave")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {autoSections.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {autoSections.map((section) => (
              <label key={section.key} className="field-group">
                <span>{t("mock.autoLabel", { title: section.title })}</span>
                <input value={section.score === null ? "—" : String(section.score)} readOnly disabled />
              </label>
            ))}
          </div>
        ) : null}

        {manualSections.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {manualSections.map((section) => (
              <label key={section.key} className="field-group">
                <span>{section.title}</span>
                <input
                  inputMode="decimal"
                  value={scores[section.key] ?? ""}
                  placeholder={t("mock.scorePlaceholder")}
                  onChange={(event) =>
                    setScores((current) => ({ ...current, [section.key]: event.target.value }))
                  }
                />
              </label>
            ))}
          </div>
        ) : null}

        <span className="flex items-center gap-3 rounded-xl bg-action-subtle px-4 py-3">
          <small className="flex-1 text-label-strong text-action">{t("mock.overallBand")}</small>
          <strong className="font-heading text-h3 text-action">{overall}</strong>
        </span>

        <label className="field-group">
          <span>{t("mock.scoreComment")}</span>
          <textarea rows={2} value={comment} onChange={(event) => setComment(event.target.value)} />
        </label>
      </div>
    </AppDialog>
  );
}
