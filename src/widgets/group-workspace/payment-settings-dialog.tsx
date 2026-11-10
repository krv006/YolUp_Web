import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { describeCreateError } from "@/modules/auth";
import { useUpdateCoursePayments } from "@/modules/course";
import type { Course } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";

const FORM_ID = "payment-settings";
const REMINDER_OPTIONS = [7, 5, 3] as const;
const DAYS = Array.from({ length: 28 }, (_, index) => index + 1);
const INPUT =
  "h-12.5 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

interface Draft {
  fee: string;
  day: string;
  reminders: number[];
}

function draftFrom(course: Course | null | undefined): Draft {
  return {
    fee: course?.monthlyFee ? String(course.monthlyFee) : "",
    day: course?.paymentDay ? String(course.paymentDay) : "",
    reminders: course?.paymentReminderDays ?? [],
  };
}

export function PaymentSettingsDialog({
  course,
  open,
  onOpenChange,
}: {
  course: Course | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("group");
  const save = useUpdateCoursePayments();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(course));
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (syncedOpen !== open) {
    setSyncedOpen(open);
    if (open) setDraft(draftFrom(course));
  }
  const hasDay = Boolean(draft.day);

  function toggleReminder(day: number) {
    setDraft((current) => ({
      ...current,
      reminders: current.reminders.includes(day)
        ? current.reminders.filter((item) => item !== day)
        : [...current.reminders, day],
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course) return;
    const fee = draft.fee.trim() ? Number(draft.fee) : null;
    save.mutate(
      {
        id: course.id,
        settings: {
          monthlyFee: fee && fee > 0 ? fee : null,
          paymentDay: hasDay ? Number(draft.day) : null,
          reminderDays: hasDay ? draft.reminders : [],
        },
      },
      {
        onSuccess: () => {
          toast.success(t("paymentSettings.saved"));
          onOpenChange(false);
        },
        onError: (error) => toast.error(describeCreateError(error)),
      }
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="adaptive"
      width="lg:max-w-115"
      title={t("paymentSettings.title")}
      description={t("paymentSettings.description")}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={() => onOpenChange(false)}>
            {t("paymentSettings.cancel")}
          </button>
          <button type="submit" form={FORM_ID} className={dialogButton.primary} disabled={save.isPending || !course}>
            {t("paymentSettings.save")}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="flex flex-col gap-4" onSubmit={submit}>
        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("paymentSettings.fee")}</span>
          <input
            className={INPUT}
            inputMode="numeric"
            value={draft.fee}
            placeholder={t("paymentSettings.feePlaceholder")}
            onChange={(event) => setDraft({ ...draft, fee: event.target.value.replace(/\D/g, "").slice(0, 10) })}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("paymentSettings.day")}</span>
          <select
            className={INPUT}
            value={draft.day}
            onChange={(event) => setDraft({ ...draft, day: event.target.value })}
          >
            <option value="">{t("paymentSettings.noDay")}</option>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {t("paymentSettings.dayOption", { day })}
              </option>
            ))}
          </select>
          <small className="text-caption text-ink-tertiary">{t("paymentSettings.dayHint")}</small>
        </label>

        <fieldset className="flex flex-col gap-2" disabled={!hasDay}>
          <legend className="mb-2 text-body-xs text-ink-secondary">{t("paymentSettings.reminders")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {REMINDER_OPTIONS.map((day) => {
              const active = hasDay && draft.reminders.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={active}
                  className={`flex h-11 items-center justify-center rounded-full text-body-sm font-medium transition-colors disabled:opacity-50 ${
                    active ? "bg-brand text-on-action" : "bg-subtle text-ink hover:bg-muted"
                  }`}
                  onClick={() => toggleReminder(day)}
                >
                  {t("paymentSettings.reminderOption", { count: day })}
                </button>
              );
            })}
          </div>
          <small className="text-caption text-ink-tertiary">
            {hasDay ? t("paymentSettings.remindersHint") : t("paymentSettings.remindersNeedDay")}
          </small>
        </fieldset>
      </form>
    </AppDialog>
  );
}
