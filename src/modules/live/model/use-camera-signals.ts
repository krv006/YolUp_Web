import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalParticipantPermissions, useRoomContext } from "@livekit/components-react";
import { toast } from "sonner";
import { useBoardChannel, useTeacherSignals, type BoardSocketEvent } from "@/modules/board";
import { CAMERA_SOURCE, canPublishSource } from "../lib/live-permissions";
import { useCancelCameraRequest, useDenyCamera, useGrantCamera, useRequestCamera } from "./live.queries";

export interface CameraRequest {
  studentId: string;
  name: string;
}

export function useCameraSignals(lessonId: string, isTeacher: boolean) {
  const room = useRoomContext();
  const permissions = useLocalParticipantPermissions();
  const grant = useGrantCamera(lessonId);
  const deny = useDenyCamera(lessonId);
  const request = useRequestCamera(lessonId);
  const cancel = useCancelCameraRequest(lessonId);

  const [live, setLive] = useState<CameraRequest[]>([]);
  const [answered, setAnswered] = useState<string[]>([]);
  const [waiting, setWaiting] = useState(false);

  const signals = useTeacherSignals(lessonId, { enabled: isTeacher });
  const pending = signals.data?.pendingCameraRequests;

  const requests = useMemo(() => {
    if (!isTeacher) return [];
    const queue = new Map<string, CameraRequest>();
    for (const item of pending ?? []) queue.set(item.id, { studentId: item.id, name: item.name });
    for (const item of live) if (!queue.has(item.studentId)) queue.set(item.studentId, item);
    for (const studentId of answered) queue.delete(studentId);
    return [...queue.values()];
  }, [isTeacher, pending, live, answered]);

  const canPublishCamera = canPublishSource(permissions, CAMERA_SOURCE);
  const pendingEnable = useRef(false);

  const enableCamera = useCallback(() => {
    room.localParticipant.setCameraEnabled(true).catch(() => {
      toast.error("Kamera yoqilmadi", {
        description: "Brauzerda kameraga ruxsat berilganini va boshqa ilova kamerani band qilmaganini tekshiring.",
      });
    });
  }, [room]);

  const { mutate: grantCamera } = grant;
  const { mutate: denyCamera } = deny;

  const isMine = useCallback(
    (studentId: string) => !isTeacher && studentId === room.localParticipant.identity,
    [isTeacher, room]
  );

  const handleEvent = useCallback(
    (event: BoardSocketEvent) => {
      if (event.type === "camera_request") {
        if (!isTeacher) return;
        const incoming: CameraRequest = { studentId: event.studentId, name: event.name || "O‘quvchi" };
        setAnswered((current) => current.filter((id) => id !== incoming.studentId));
        setLive((current) =>
          current.some((item) => item.studentId === incoming.studentId)
            ? current
            : [...current, incoming]
        );
        toast(`${incoming.name} kamerasini yoqmoqchi`, {
          description: "Kamera uchun ruxsat so‘rayapti.",
          duration: 12_000,
          action: { label: "Ruxsat berish", onClick: () => grantCamera(incoming.studentId) },
          cancel: { label: "Rad etish", onClick: () => denyCamera(incoming.studentId) },
        });
        return;
      }

      if (event.type === "camera_request_cancelled") {
        setAnswered((current) => (current.includes(event.studentId) ? current : [...current, event.studentId]));
        if (isMine(event.studentId)) setWaiting(false);
        return;
      }

      if (event.type !== "camera_granted" && event.type !== "camera_denied") return;

      setAnswered((current) =>
        current.includes(event.studentId) ? current : [...current, event.studentId]
      );
      if (!isMine(event.studentId)) return;
      setWaiting(false);

      if (event.type === "camera_denied") {
        toast.error("O‘qituvchi hozircha ruxsat bermadi");
        return;
      }

      toast.success("O‘qituvchi kamerangizni yoqdi");
      if (canPublishCamera) enableCamera();
      else pendingEnable.current = true;
    },
    [canPublishCamera, denyCamera, enableCamera, grantCamera, isMine, isTeacher]
  );

  useBoardChannel(lessonId, Boolean(lessonId), handleEvent);

  useEffect(() => {
    if (!pendingEnable.current || !canPublishCamera) return;
    pendingEnable.current = false;
    enableCamera();
  }, [canPublishCamera, enableCamera]);

  const { mutate: sendRequest } = request;
  const requestCamera = useCallback(
    () => sendRequest(undefined, { onSuccess: () => setWaiting(true) }),
    [sendRequest]
  );

  const { mutate: sendCancel } = cancel;
  const cancelCamera = useCallback(() => sendCancel(undefined, { onSuccess: () => setWaiting(false) }), [sendCancel]);

  return {
    requests,
    grant,
    deny,
    requestCamera,
    cancelCamera,
    cancelling: cancel.isPending,
    requesting: request.isPending,
    waiting,
  };
}
