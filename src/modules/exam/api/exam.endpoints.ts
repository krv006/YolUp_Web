export const examEndpoints = Object.freeze({
  templates: "/api/v1/exams/templates/",
  template: (id: string) => `/api/v1/exams/templates/${id}/`,
  list: "/api/v1/exams/",
  detail: (id: string) => `/api/v1/exams/${id}/`,
  current: (id: string) => `/api/v1/exams/${id}/current/`,
  answers: (id: string) => `/api/v1/exams/${id}/answers/`,
  finish: (id: string) => `/api/v1/exams/${id}/finish/`,
  results: (id: string) => `/api/v1/exams/${id}/results/`,
  studentResult: (id: string, studentId: string) => `/api/v1/exams/${id}/results/${studentId}/`,
  manualScores: (id: string, studentId: string) => `/api/v1/exams/${id}/results/${studentId}/manual/`,
  aiReview: (id: string, studentId: string) => `/api/v1/exams/${id}/results/${studentId}/ai/`,
  aiApprove: (id: string, studentId: string) => `/api/v1/exams/${id}/results/${studentId}/ai/approve/`,
});
