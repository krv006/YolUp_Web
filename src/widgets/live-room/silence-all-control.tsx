import { MicOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSilenceAll } from "./use-silence-all";

export function SilenceAllControl({ lessonId }: { lessonId: string }) {
  const { t } = useTranslation("live");
  const silence = useSilenceAll(lessonId);
  return (
    <button
      type="button"
      className="live-control"
      aria-label={t("silenceAll.aria")}
      title={t("silenceAll.aria")}
      disabled={silence.pending}
      onClick={silence.run}
    >
      <MicOff size={19} />
    </button>
  );
}
