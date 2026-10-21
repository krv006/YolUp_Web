export const lessonEndpoints = Object.freeze({
  list: "/api/v1/lessons/",
  detail: (id: string) => `/api/v1/lessons/${id}/`,
  finish: (id: string) => `/api/v1/lessons/${id}/finish/`,
  cancel: (id: string) => `/api/v1/lessons/${id}/cancel/`,
  recording: (id: string) => `/api/v1/lessons/${id}/recording/`,
  recordingAudio: (id: string) => `/api/v1/lessons/${id}/recording/audio/`,
  finalizeRecordingAudio: (id: string) => `/api/v1/lessons/${id}/recording/audio/finalize/`,
  recordingVideo: (id: string) => `/api/v1/lessons/${id}/recording/video/`,
  finalizeRecordingVideo: (id: string) => `/api/v1/lessons/${id}/recording/video/finalize/`,
  schedule: (courseId: string) => `/api/v1/courses/${courseId}/schedule/`,
  rate: (id: string) => `/api/v1/lessons/${id}/rate/`,
  ratings: (id: string) => `/api/v1/lessons/${id}/ratings/`,
});
