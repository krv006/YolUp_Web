import { useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { encodeScreenShareRequest } from "@/modules/live";

export function useScreenShareRequest() {
  const { t } = useTranslation("live");
  const room = useRoomContext();
  const [requesting, setRequesting] = useState(false);

  async function request() {
    if (requesting) return;
    setRequesting(true);
    try {
      const signal = encodeScreenShareRequest(
        room.localParticipant.name || room.localParticipant.identity
      );
      await room.localParticipant.publishData(signal.payload, {
        reliable: true,
        topic: signal.topic,
      });
      toast.success(t("share.requestSentToast"));
    } catch {
      toast.error(t("share.requestFailedToast"));
    } finally {
      setRequesting(false);
    }
  }

  return { request, requesting };
}
