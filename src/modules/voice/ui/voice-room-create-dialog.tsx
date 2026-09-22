import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { DatePicker, SelectPicker } from "@/shared/ui/legacy/form-pickers";
import type { VoiceAccessMode } from "@/shared/types";
import type { VoiceRoomFormValues } from "../api/voice.dto";

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
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      {open ? (
        <DialogContent
          className="group-action-dialog"
          title={t("createDialog.title")}
          description={t("createDialog.description")}
        >
          <div className="group-action-form">
            <label>
              {t("createDialog.nameLabel")}
              <input
                autoFocus
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setError(null);
                }}
                placeholder={t("createDialog.namePlaceholder")}
              />
            </label>
            <SelectPicker
              label={t("createDialog.accessLabel")}
              value={accessMode}
              onChange={(value) => setAccessMode(value as VoiceAccessMode)}
              options={[
                { value: "open", label: t("access.open") },
                { value: "invite_only", label: t("access.inviteOnly") },
              ]}
            />
            <small className="voice-hint">
              {accessMode === "open" ? t("createDialog.openHint") : t("createDialog.inviteHint")}
            </small>
            <DatePicker
              label={t("createDialog.scheduledLabel")}
              value={scheduledAt}
              onChange={setScheduledAt}
              includeTime
              optional
            />

            {error ? <div className="form-alert">{error}</div> : null}

            <div className="dialog-actions">
              <Button type="button" variant="secondary" onClick={close}>
                {t("createDialog.cancel")}
              </Button>
              <Button type="button" loading={pending} onClick={submit}>
                {t("createDialog.submit")}
              </Button>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
