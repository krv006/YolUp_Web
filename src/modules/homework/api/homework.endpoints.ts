export const homeworkEndpoints = Object.freeze({
  assignments: "/api/v1/homework/assignments/", assignment: (id: string) => `/api/v1/homework/assignments/${id}/`,
  assignmentFile: (id: string) => `/api/v1/homework/assignments/${id}/file/`, submit: (id: string) => `/api/v1/homework/assignments/${id}/submit/`,
  submission: (id: string) => `/api/v1/homework/submissions/${id}/`, submissionFile: (id: string) => `/api/v1/homework/submissions/${id}/file/`,
  recheck: (id: string) => `/api/v1/homework/submissions/${id}/recheck/`,
  review: (id: string) => `/api/v1/homework/submissions/${id}/review/`,
  board: (id: string) => `/api/v1/homework/assignments/${id}/board/`,
  boardSubmit: (id: string) => `/api/v1/homework/assignments/${id}/board/submit/`,
  report: "/api/v1/homework/report/",
});
