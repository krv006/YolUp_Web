import { useTranslation } from "react-i18next";
import type { AssignmentVoice } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { useProtectedAudio } from "../model/use-protected-audio";

export function VoiceAudio({ src, className = "" }: { src: string; className?: string }) {
  return <audio className={`h-10 w-full min-w-0 ${className}`} src={src} controls preload="metadata" />;
}

export function AssignmentVoicePlayer({ voice, className = "" }: { voice: AssignmentVoice; className?: string }) {
  const { t } = useTranslation("homework");
  const audio = useProtectedAudio(voice.url);

  return (
    <div className={`flex flex-col gap-2 rounded-xl bg-subtle p-3 ${className}`}>
      <span className="flex items-center gap-2 text-body-sm font-medium text-ink">
        <Icon name="mic" size={18} className="text-brand" />
        {t("voice.title")}
      </span>
      {audio.src ? (
        <VoiceAudio src={audio.src} />
      ) : audio.failed ? (
        <small className="text-caption text-error-text">{t("voice.loadFailed")}</small>
      ) : (
        <span className="block h-10 w-full animate-pulse rounded-full bg-skeleton motion-reduce:animate-none" />
      )}
    </div>
  );
}
