import { useEffect, useRef } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { useReleaseMedia } from "@/modules/live";

export function useScreenShareRelease(lessonId: string, enabled: boolean) {
  const { isScreenShareEnabled } = useLocalParticipant();
  const { mutate: release } = useReleaseMedia(lessonId);
  const sharedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (isScreenShareEnabled) {
      sharedRef.current = true;
      return;
    }
    if (!sharedRef.current) return;
    sharedRef.current = false;
    release("screen");
  }, [enabled, isScreenShareEnabled, release]);
}
