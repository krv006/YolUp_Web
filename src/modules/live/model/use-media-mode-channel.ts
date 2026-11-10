import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useBoardChannel, type BoardSocketEvent } from "@/modules/board";
import type { MediaMode } from "../api/live.dto";
import { liveKeys } from "./live.queries";

export function useMediaModeChannel(lessonId: string, isTeacher: boolean) {
  const { t } = useTranslation("live");
  const client = useQueryClient();

  const handleEvent = useCallback(
    (event: BoardSocketEvent) => {
      if (event.type !== "media_mode") return;
      const key = liveKeys.mediaMode(lessonId);
      const previous = client.getQueryData<MediaMode>(key);
      const next: MediaMode = { openMic: event.openMic, openCamera: event.openCamera };
      client.setQueryData(key, next);
      if (isTeacher || !previous) return;
      if (previous.openMic !== next.openMic) toast.info(t(next.openMic ? "mediaMode.micOpened" : "mediaMode.micClosed"));
      if (previous.openCamera !== next.openCamera)
        toast.info(t(next.openCamera ? "mediaMode.cameraOpened" : "mediaMode.cameraClosed"));
    },
    [client, isTeacher, lessonId, t]
  );

  useBoardChannel(lessonId, Boolean(lessonId), handleEvent);
}
