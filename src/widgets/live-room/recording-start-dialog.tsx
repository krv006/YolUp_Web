import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRecordingChoice, useSetRecordingChoice } from "@/modules/lesson";
import { requestScreenCapture } from "@/modules/live";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";

export interface RecordingStartDialogProps {
  lessonId: string;
  open: boolean;
  withScreen: boolean;
  onClose: () => void;
  onScreen: (stream: MediaStream) => void;
}

export function RecordingStartDialog({ lessonId, open, withScreen, onClose, onScreen }: RecordingStartDialogProps) {
  const { t } = useTranslation("live");
  const { t: tl } = useTranslation("lesson");
  const choice = useRecordingChoice(lessonId).data;
  const save = useSetRecordingChoice(lessonId);
  const [post, setPost] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const value = post ?? choice?.postRecording ?? true;

  function remember() {
    if (!choice?.decided || choice.postRecording !== value) save.mutate(value);
  }

  function later() {
    remember();
    setError(null);
    onClose();
  }

  async function start() {
    if (typeof navigator.mediaDevices?.getDisplayMedia !== "function") {
      setError(t("recordingStart.unsupported"));
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const stream = await requestScreenCapture();
      if (!stream.getAudioTracks().length) {
        stream.getTracks().forEach((track) => track.stop());
        setError(t("recordingStart.noAudio"));
        return;
      }
      remember();
      onScreen(stream);
      onClose();
    } catch {
      setError(t("recordingStart.denied"));
    } finally {
      setStarting(false);
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => !next && later()}
      variant="adaptive"
      width="lg:max-w-120"
      title={withScreen ? t("recordingStart.title") : t("recordingStart.mobileTitle")}
      description={withScreen ? t("recordingStart.text") : t("recordingStart.mobileText")}
      footer={
        withScreen ? (
          <>
            <button type="button" className={dialogButton.secondary} disabled={starting} onClick={later}>
              {t("recordingStart.later")}
            </button>
            <button type="button" className={dialogButton.primary} disabled={starting} onClick={() => void start()}>
              {starting ? t("recordingStart.starting") : t("recordingStart.start")}
            </button>
          </>
        ) : (
          <button type="button" className={dialogButton.primary} onClick={later}>
            {t("recordingStart.continue")}
          </button>
        )
      }
    >
      <div className="flex flex-col gap-3 pb-1">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-subtle px-4 py-3">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-body-sm font-medium text-ink">{tl("finishDialog.postRecording")}</span>
            <small className="text-caption text-ink-secondary">
              {value ? tl("finishDialog.postRecordingHint") : tl("finishDialog.keepRecordingHint")}
            </small>
          </span>
          <Switch checked={value} onCheckedChange={setPost} aria-label={tl("finishDialog.postRecording")} />
        </label>
        {error ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-bg px-3.5 py-2.5 text-body-sm text-error-text">
            <Icon name="warning" size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
    </AppDialog>
  );
}
