import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AudienceInput } from "@/modules/conversation";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { AudiencePicker } from "@/widgets/audience-picker";

const FIELD =
  "w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

export interface CreateAudienceValues extends AudienceInput {
  title: string;
  description: string;
}

export interface CreateAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "channel" | "club";
  pending: boolean;
  onSubmit: (values: CreateAudienceValues, reset: () => void) => void;
}

const EMPTY: CreateAudienceValues = { title: "", description: "", courseIds: [], studentIds: [] };

export function CreateAudienceDialog({ open, onOpenChange, kind, pending, onSubmit }: CreateAudienceDialogProps) {
  const { t } = useTranslation("chat");
  const [values, setValues] = useState<CreateAudienceValues>(EMPTY);
  const reset = () => setValues(EMPTY);
  const ready = values.title.trim() && (values.courseIds.length || values.studentIds.length);

  function close() {
    reset();
    onOpenChange(false);
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      variant="adaptive"
      width="lg:max-w-130"
      title={t(`create.${kind}.title`)}
      description={t(`create.${kind}.description`)}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={close}>
            {t("create.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={!ready || pending}
            onClick={() => onSubmit(values, reset)}
          >
            {t("create.submit")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t(`create.${kind}.nameLabel`)}</span>
          <input
            className={`${FIELD} h-12`}
            value={values.title}
            maxLength={120}
            placeholder={t(`create.${kind}.namePlaceholder`)}
            onChange={(event) => setValues({ ...values, title: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("create.descriptionLabel")}</span>
          <textarea
            rows={2}
            maxLength={1000}
            className={`${FIELD} resize-none py-3`}
            value={values.description}
            placeholder={t("create.descriptionPlaceholder")}
            onChange={(event) => setValues({ ...values, description: event.target.value })}
          />
        </label>
        <p className="rounded-md bg-brand-subtle px-4 py-3 text-body-sm text-brand">{t(`create.${kind}.audienceHint`)}</p>
        <AudiencePicker
          value={{ courseIds: values.courseIds, studentIds: values.studentIds }}
          onChange={(audience) => setValues({ ...values, ...audience })}
        />
      </div>
    </AppDialog>
  );
}
