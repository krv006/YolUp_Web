import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog } from "@/shared/ui/app-dialog";
import { DatePicker } from "@/shared/ui/legacy/form-pickers";
import type { VoiceAccessMode } from "@/shared/types";
import type { VoiceRoomFormValues } from "../api/voice.dto";

const ACCESS_MODES: VoiceAccessMode[] = ["open", "invite_only"];

export interface VoiceRoomCreateDialogProps {
  courseId: string;
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: VoiceRoomFormValues) => void;
}

export function VoiceRoomCreateDialog({
  courseId,
  open,
  pending = false,
  onOpenChange,
  onCreate,
}: VoiceRoomCreateDialogProps) {
  const { t } = useTranslation("voice");
  const [title, setTitle] = useState("");
  const [accessMode, setAccessMode] = useState<VoiceAccessMode>("open");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  function close() {
    setTitle("");
    setAccessMode("open");
    setScheduledAt("");
    setError(null);
    onOpenChange(false);
  }

  function submit() {
    if (!title.trim()) {
      setError(t("createDialog.titleRequired"));
      return;
    }
    if (scheduledAt && new Date(scheduledAt).getTime() < Date.now()) {
      setError(t("createDialog.pastTime"));
      return;
    }
    onCreate({
      courseId,
      title: title.trim(),
      accessMode,
      scheduledAt: scheduledAt || null,
    });
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      variant="confirm"
      width="lg:w-130"
      title={t("createDialog.title")}
      description={t("createDialog.description")}
      footer={
        <>
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
            onClick={close}
          >
            {t("createDialog.cancel")}
          </button>
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50"
            disabled={pending}
            onClick={submit}
          >
            {t("createDialog.submit")}
          </button>
        </>
      }
    >
      <label className="flex flex-col gap-2">
        <span className="text-body-xs text-ink-secondary">{t("createDialog.nameLabel")}</span>
        <input
          autoFocus
          className="h-13 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
          value={title}
          placeholder={t("createDialog.namePlaceholder")}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
        />
      </label>

      <div className="flex flex-col gap-2" role="radiogroup">
        {ACCESS_MODES.map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={accessMode === item}
            className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
              accessMode === item ? "border-brand bg-brand-subtle" : "border-line bg-surface"
            }`}
            onClick={() => setAccessMode(item)}
          >
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                accessMode === item ? "border-brand" : "border-line-strong"
              }`}
            >
              {accessMode === item ? <span className="size-2.5 rounded-full bg-brand" /> : null}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm text-ink">
                {t(`access.${item === "open" ? "open" : "inviteOnly"}`)}
              </strong>
              <small className="truncate text-body-xs text-ink-tertiary">
                {item === "open" ? t("createDialog.openHint") : t("createDialog.inviteHint")}
              </small>
            </span>
          </button>
        ))}
      </div>

      <DatePicker
        label={t("createDialog.scheduledLabel")}
        value={scheduledAt}
        onChange={setScheduledAt}
        includeTime
        optional
      />

      {error ? (
        <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">{error}</p>
      ) : null}
    </AppDialog>
  );
}
