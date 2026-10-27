import { useState } from "react";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { ExamStudentResult } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";

export interface ExamScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ExamStudentResult | null;
  suggested?: Record<string, number>;
  prefill?: Record<string, number>;
  pending?: boolean;
  onSave: (scores: Record<string, number>, comment: string) => void;
}

export function ExamScoreDialog({
  open,
  onOpenChange,
  result,
  suggested = {},
  prefill,
  pending = false,
  onSave,
}: ExamScoreDialogProps) {
  const { t } = useTranslation("exam");
  const isCompact = useIsCompact();
  const [scores, setScores] = useState<Record<string, string>>({});
  const [syncedId, setSyncedId] = useState<string | null>(null);
  const syncKey = result ? `${result.studentId}:${JSON.stringify(prefill ?? {})}:${open}` : null;

  if (result && syncedId !== syncKey) {
    setSyncedId(syncKey);
    setScores(
      Object.fromEntries(
        result.sections
          .filter((section) => section.manual)
          .map((section) => [
            section.key,
            prefill?.[section.key] !== undefined
              ? String(prefill[section.key])
              : section.score === null
                ? ""
                : String(section.score),
          ])
      )
    );
  }

  if (!result) return null;


  const values = result.sections
    .map((section) => {
      const raw = (scores[section.key] ?? "").trim().replace(",", ".");
      return section.manual ? (raw ? Number(raw) : Number.NaN) : (section.score ?? Number.NaN);
    })
    .filter((value) => Number.isFinite(value)) as number[];
  const overall = values.length
    ? (Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 2) / 2).toFixed(1)
    : "—";

  function save() {
    const payload: Record<string, number> = {};
    for (const [key, value] of Object.entries(scores)) {
      const score = Number(value.replace(",", "."));
      if (value.trim() && Number.isFinite(score)) payload[key] = score;
    }
    onSave(payload, "");
  }

  if (isCompact)
    return (
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        variant="adaptive"
        title={t("mock.scoreTitle", { name: result.studentName })}
        description={t("mock.scoreDescription")}
        footerClassName="px-4 pt-5 pb-[19px]"
        footer={
          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              className={`${dialogButton.secondary} h-13 border-line-strong text-title font-semibold`}
              onClick={() => onOpenChange(false)}
            >
              {t("mock.scoreCancel")}
            </button>
            <button
              type="button"
              className={`${dialogButton.primary} h-13 text-title font-semibold`}
              disabled={pending}
              onClick={save}
            >
              {t("mock.scoreSave")}
            </button>
          </div>
        }
      >
        <div className="-mt-1 flex flex-col gap-2.5">
          {result.sections.map((section) => {
            const manual = section.manual;
            const hint = suggested[section.key];
            return (
              <label
                key={section.key}
                className={`flex h-[58px] items-center gap-3 rounded-lg px-3 transition-colors ${
                  manual
                    ? "border-[1.5px] border-line bg-surface focus-within:border-brand focus-within:bg-brand-subtle/40"
                    : "border-[1.5px] border-transparent bg-subtle"
                }`}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title-sm text-ink">{section.title}</strong>
                  <small className={`truncate text-caption font-normal ${manual ? "text-brand" : "text-ink-secondary"}`}>
                    {!manual
                      ? t("mock.autoScored")
                      : hint !== undefined
                        ? t("mock.aiSuggestion", { value: hint.toFixed(1) })
                        : t("mock.enterBand")}
                  </small>
                </span>
                {manual ? (
                  <input
                    className="w-16 shrink-0 bg-transparent text-right font-heading text-title-lg text-ink outline-none placeholder:text-ink"
                    inputMode="decimal"
                    value={scores[section.key] ?? ""}
                    placeholder="—"
                    onChange={(event) => setScores((current) => ({ ...current, [section.key]: event.target.value }))}
                  />
                ) : (
                  <span className="flex shrink-0 items-center gap-3">
                    <Icon name="lock-fill" size={14} className="text-ink-secondary" />
                    <strong className="font-heading text-title-lg text-ink">
                      {section.score === null ? "—" : section.score.toFixed(1)}
                    </strong>
                  </span>
                )}
              </label>
            );
          })}
          <span className="flex items-center gap-3 pt-1.5">
            <small className="min-w-0 flex-1 truncate text-body-sm text-ink-secondary">{t("mock.overallBand")}</small>
            <strong className="shrink-0 font-heading text-h2 text-brand">{overall}</strong>
          </span>
        </div>
      </AppDialog>
    );

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
            onClick={save}
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
