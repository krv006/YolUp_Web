import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCameraOffAll, useMuteAll } from "@/modules/live";

export function useSilenceAll(lessonId: string) {
  const { t } = useTranslation("live");
  const muteAll = useMuteAll(lessonId);
  const cameraOffAll = useCameraOffAll(lessonId);
  const pending = muteAll.isPending || cameraOffAll.isPending;

  function run() {
    if (pending) return;
    void Promise.allSettled([muteAll.mutateAsync([]), cameraOffAll.mutateAsync([])]).then(([mics, cameras]) => {
      if (mics.status === "fulfilled" && cameras.status === "fulfilled")
        toast.success(t("silenceAll.done", { mics: mics.value, cameras: cameras.value }));
    });
  }

  return { run, pending };
}
