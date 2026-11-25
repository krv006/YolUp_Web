import { useEffect, useRef, useState } from "react";
import {
  createTeacherAudioRecording,
  releaseTeacherAudioRecording,
  type TeacherAudioRecordingSession,
  type TeacherAudioRecordingSnapshot,
} from "../lib/teacher-audio-recording";

const INITIAL_SNAPSHOT: TeacherAudioRecordingSnapshot = {
  phase: "idle",
  pendingChunks: 0,
  uploadedChunks: 0,
  error: null,
};

export function useTeacherAudioRecording(
  lessonId: string,
  tracks: readonly MediaStreamTrack[],
  enabled: boolean
): TeacherAudioRecordingSnapshot {
  const sessionRef = useRef<TeacherAudioRecordingSession | null>(null);
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);

  useEffect(() => {
    if (!enabled) return;
    const session = createTeacherAudioRecording(lessonId);
    sessionRef.current = session;
    const unsubscribe = session.subscribe(setSnapshot);
    session.start();

    return () => {
      unsubscribe();
      sessionRef.current = null;
      releaseTeacherAudioRecording(session);
      setSnapshot(INITIAL_SNAPSHOT);
    };
  }, [enabled, lessonId]);

  useEffect(() => {
    sessionRef.current?.syncTracks(tracks);
  }, [tracks]);

  return snapshot;
}
