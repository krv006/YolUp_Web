export interface RecordingChoice {
  postRecording: boolean | null;
  decided: boolean;
}

export function mapRecordingChoice(dto: unknown): RecordingChoice {
  const raw = (dto ?? {}) as { post_recording?: unknown; decided?: unknown };
  const postRecording = typeof raw.post_recording === "boolean" ? raw.post_recording : null;
  return { postRecording, decided: postRecording !== null && raw.decided !== false };
}
