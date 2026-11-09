import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { describeCreateError } from "@/modules/auth";
import { useMarkPaid, type Payment } from "@/modules/progress";
import { AppDialog } from "@/shared/ui/app-dialog";
import { formatProgressMoney, formatProgressMonth } from "./progress-format";

export interface PaymentTarget {
  studentId: string;
  name: string;
  month: string;
  payment: Payment | null;
}

const FORM_ID = "progress-payment";
const NOTES = ["cash", "card", "transfer"] as const;
const INPUT =
  "h-12.5 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

export function PaymentDialog({
  courseId,
  target,
  monthlyFee,
  onClose,
}: {
  courseId: string | null;
  target: PaymentTarget | null;
  monthlyFee: number | null;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation("group");
  const markPaid = useMarkPaid();
  const key = target ? `${target.studentId}:${target.month}` : "";
  const initial = {
    key,
    amount: String(target?.payment?.amount ?? monthlyFee ?? ""),
    note: target?.payment?.note ?? "",
  };
  const [draft, setDraft] = useState(initial);
  const form = draft.key === key ? draft : initial;
  const editing = target?.payment?.status === "paid";

  function update(patch: Partial<Pick<typeof form, "amount" | "note">>) {
    setDraft({ ...form, ...patch });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseId || !target) return;
    markPaid.mutate(
      {
        courseId,
        studentId: target.studentId,
        month: target.month,
        amount: form.amount ? Number(form.amount) : undefined,
        note: form.note.trim(),
      },
      {
        onSuccess: () => {
          toast.success(t(editing ? "progress.payment.updated" : "progress.markedPaid", { name: target.name }));
          onClose();
        },
        onError: (error) => toast.error(describeCreateError(error)),
      }
    );
  }

  return (
    <AppDialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant="adaptive"
      width="lg:max-w-115"
      title={t(editing ? "progress.payment.editTitle" : "progress.payment.title")}
      description={target ? `${target.name} · ${formatProgressMonth(target.month, i18n.language)}` : undefined}
      footerClassName="justify-end px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] lg:px-6 lg:pb-6"
      footer={
        <>
          <button
            type="button"
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-line-strong bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle lg:flex-none"
            onClick={onClose}
          >
            {t("progress.cancel")}
          </button>
          <button
            type="submit"
            form={FORM_ID}
            disabled={markPaid.isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-60 lg:flex-none"
          >
            {t("progress.payment.save")}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="flex flex-col gap-4 pb-1" onSubmit={submit}>
        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("progress.payment.amount")}</span>
          <span className="relative">
            <input
              autoFocus
              inputMode="numeric"
              className={`${INPUT} pr-16 font-numeric`}
              value={form.amount ? formatProgressMoney(Number(form.amount), i18n.language) : ""}
              placeholder={monthlyFee ? formatProgressMoney(monthlyFee, i18n.language) : "0"}
              onChange={(event) => update({ amount: event.target.value.replace(/\D/g, "").slice(0, 10) })}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-body-sm text-ink-tertiary">
              {t("progress.payment.currency")}
            </span>
          </span>
          {monthlyFee && form.amount && Number(form.amount) !== monthlyFee ? (
            <small className="text-caption text-ink-secondary">
              {t("progress.fee", { amount: formatProgressMoney(monthlyFee, i18n.language) })}
            </small>
          ) : null}
        </label>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${FORM_ID}-note`} className="text-body-xs text-ink-secondary">
            {t("progress.payment.note")}
          </label>
          <input
            id={`${FORM_ID}-note`}
            className={INPUT}
            value={form.note}
            maxLength={120}
            placeholder={t("progress.payment.notePlaceholder")}
            onChange={(event) => update({ note: event.target.value })}
          />
          <span className="flex flex-wrap gap-2">
            {NOTES.map((item) => {
              const label = t(`progress.payment.notes.${item}`);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={form.note === label}
                  className={`flex h-8 items-center rounded-full px-3.5 text-body-xs font-medium transition-colors ${
                    form.note === label ? "bg-brand text-on-action" : "bg-subtle text-ink hover:bg-muted"
                  }`}
                  onClick={() => update({ note: form.note === label ? "" : label })}
                >
                  {label}
                </button>
              );
            })}
          </span>
        </div>
      </form>
    </AppDialog>
  );
}
