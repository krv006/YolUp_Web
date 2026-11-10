import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalParticipantPermissions, useRoomContext } from "@livekit/components-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useBoardChannel, useTeacherSignals, type BoardSocketEvent } from "@/modules/board";
import { canPublishSource, identityUserId, MICROPHONE_SOURCE } from "../lib/live-permissions";
import { useCancelMicRequest, useDenyMic, useGrantMic, useMediaMode, useReleaseMedia, useRequestMic } from "./live.queries";

export interface MicRequest {
  studentId: string;
  name: string;
}

const RELEASE_ECHO_MS = 5_000;

export function useMicSignals(lessonId: string, isTeacher: boolean) {
  const { t } = useTranslation("live");
  const room = useRoomContext();
  const permissions = useLocalParticipantPermissions();
  const grant = useGrantMic(lessonId);
  const deny = useDenyMic(lessonId);
  const request = useRequestMic(lessonId);
  const cancel = useCancelMicRequest(lessonId);
  const mediaMode = useMediaMode(lessonId);
  const releaseMedia = useReleaseMedia(lessonId);
  const releasedAt = useRef(0);

  const [live, setLive] = useState<MicRequest[]>([]);
  const [answered, setAnswered] = useState<string[]>([]);
  const [waiting, setWaiting] = useState(false);

  const signals = useTeacherSignals(lessonId, { enabled: isTeacher });
  const pending = signals.data?.pendingMicRequests;

  const requests = useMemo(() => {
    if (!isTeacher) return [];
    const queue = new Map<string, MicRequest>();
    for (const item of pending ?? []) queue.set(item.id, { studentId: item.id, name: item.name });
    for (const item of live) if (!queue.has(item.studentId)) queue.set(item.studentId, item);
    for (const studentId of answered) queue.delete(studentId);
    return [...queue.values()];
  }, [isTeacher, pending, live, answered]);

  const canSpeak = canPublishSource(permissions, MICROPHONE_SOURCE);
  const pendingEnable = useRef(false);

  const enableMic = useCallback(() => {
    room.localParticipant.setMicrophoneEnabled(true).catch(() => {
      toast.error("Mikrofon yoqilmadi", {
        description: "Brauzerda mikrofonga ruxsat berilganini va boshqa ilova mikrofonni band qilmaganini tekshiring.",
      });
    });
  }, [room]);

  const { mutate: grantMic } = grant;
  const { mutate: denyMic } = deny;

  const isMine = useCallback(
    (studentId: string) => !isTeacher && studentId === identityUserId(room.localParticipant.identity),
    [isTeacher, room]
  );

  const handleEvent = useCallback(
    (event: BoardSocketEvent) => {
      if (event.type === "mic_request") {
        if (!isTeacher) return;
        const incoming: MicRequest = { studentId: event.studentId, name: event.name || "O‘quvchi" };
        setAnswered((current) => current.filter((id) => id !== incoming.studentId));
        setLive((current) =>
          current.some((item) => item.studentId === incoming.studentId)
            ? current
            : [...current, incoming]
        );
        toast(`${incoming.name} gapirmoqchi`, {
          description: "Mikrofon uchun ruxsat so‘rayapti.",
          duration: 12_000,
          action: { label: "Ruxsat berish", onClick: () => grantMic(incoming.studentId) },
          cancel: { label: "Rad etish", onClick: () => denyMic(incoming.studentId) },
        });
        return;
      }

      if (event.type === "mic_request_cancelled") {
        setAnswered((current) => (current.includes(event.studentId) ? current : [...current, event.studentId]));
        if (isMine(event.studentId)) setWaiting(false);
        return;
      }

      if (event.type === "mic_revoked") {
        if (!isMine(event.studentId)) return;
        setWaiting(false);
        pendingEnable.current = false;
        if (Date.now() - releasedAt.current > RELEASE_ECHO_MS) toast.info(t("mic.revokedToast"));
        return;
      }

      if (event.type !== "mic_granted" && event.type !== "mic_denied") return;

      setAnswered((current) =>
        current.includes(event.studentId) ? current : [...current, event.studentId]
      );
      if (!isMine(event.studentId)) return;
      setWaiting(false);

      if (event.type === "mic_denied") {
        toast.error("O‘qituvchi hozircha ruxsat bermadi");
        return;
      }

      toast.success("O‘qituvchi mikrofoningizni yoqdi");
      if (canSpeak) enableMic();
      else pendingEnable.current = true;
    },
    [canSpeak, denyMic, enableMic, grantMic, isMine, isTeacher, t]
  );

  useBoardChannel(lessonId, Boolean(lessonId), handleEvent);

  useEffect(() => {
    if (!pendingEnable.current || !canSpeak) return;
    pendingEnable.current = false;
    enableMic();
  }, [canSpeak, enableMic]);

  const { mutate: sendRequest } = request;
  const requestMic = useCallback(
    () => sendRequest(undefined, { onSuccess: () => setWaiting(true) }),
    [sendRequest]
  );

  const open = Boolean(mediaMode.data?.openMic);
  const { mutate: sendRelease } = releaseMedia;
  const release = useCallback(() => {
    if (isTeacher || open) return;
    releasedAt.current = Date.now();
    sendRelease("microphone");
  }, [isTeacher, open, sendRelease]);

  const { mutate: sendCancel } = cancel;
  const cancelMic = useCallback(() => sendCancel(undefined, { onSuccess: () => setWaiting(false) }), [sendCancel]);

  return {
    requests,
    grant,
    deny,
    requestMic,
    cancelMic,
    cancelling: cancel.isPending,
    requesting: request.isPending,
    waiting,
    release,
    open,
  };
}
