import { useTranslation } from "react-i18next";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";

export interface ReviewSaved {
  kind: "graded" | "resubmit";
  studentName: string;
  grade: number | null;
  reviewed: number;
  total: number;
  next: { id: string; name: string } | null;
}

export interface ReviewSavedDialogProps {
  saved: ReviewSaved | null;
  onNext: (id: string) => void;
  onBack: () => void;
  onClose: () => void;
}

const PRIMARY =
  "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong";
const SECONDARY =
  "flex h-12 w-full items-center justify-center rounded-full border border-line-strong bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle";

export function ReviewSavedDialog({ saved, onNext, onBack, onClose }: ReviewSavedDialogProps) {
  const { t } = useTranslation("homework");
  const graded = saved?.kind !== "resubmit";
  const reviewed = saved?.reviewed ?? 0;
  const total = Math.max(saved?.total ?? 0, reviewed);
  const percent = total ? Math.round((reviewed / total) * 100) : 0;
  const next = saved?.next ?? null;

  return (
    <AppDialog
      open={Boolean(saved)}
      onOpenChange={(open) => !open && onClose()}
      variant="confirm"
      layout="centered"
      width="lg:w-100"
      icon={
        <span
          className={`grid size-14 place-items-center rounded-full ${graded ? "bg-success-bg text-success-fg" : "bg-brand-subtle text-brand"}`}
        >
          <Icon name={graded ? "check-circle" : "refresh"} size={28} />
        </span>
      }
      title={graded ? t("reviewSaved.gradedTitle") : t("reviewSaved.resubmitTitle")}
      description={
        graded
          ? t("reviewSaved.gradedText", { name: saved?.studentName ?? "", grade: saved?.grade ?? "—" })
          : t("reviewSaved.resubmitText", { name: saved?.studentName ?? "" })
      }
      footer={
        <div className="flex w-full flex-col gap-2">
          {next ? (
            <>
              <button type="button" className={PRIMARY} onClick={() => onNext(next.id)}>
                {t("reviewSaved.next", { name: next.name })}
                <Icon name="arrow-forward" size={18} />
              </button>
              <button type="button" className={SECONDARY} onClick={onBack}>
                {t("reviewSaved.back")}
              </button>
            </>
          ) : (
            <>
              <button type="button" className={PRIMARY} onClick={onBack}>
                {t("reviewSaved.back")}
              </button>
              <button type="button" className={SECONDARY} onClick={onClose}>
                {t("reviewSaved.close")}
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-2 rounded-2xl bg-subtle/60 p-4 text-left">
        <span className="flex items-center justify-between gap-3 text-body-sm">
          <strong className="font-semibold text-ink">
            {next ? t("reviewSaved.progress", { done: reviewed, total }) : t("reviewSaved.allDone")}
          </strong>
          <small className="font-numeric text-caption-strong text-ink-secondary">{percent}%</small>
        </span>
        <span className="h-1.5 overflow-hidden rounded-full bg-surface">
          <i className="block h-full rounded-full bg-success transition-[width]" style={{ width: `${percent}%` }} />
        </span>
      </div>
    </AppDialog>
  );
}
