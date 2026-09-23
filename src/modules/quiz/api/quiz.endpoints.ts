export const quizEndpoints = Object.freeze({
  list: "/api/v1/quizzes/",
  detail: (id: string) => `/api/v1/quizzes/${id}/`,
  attempts: (id: string) => `/api/v1/quizzes/${id}/attempts/`,
  import: "/api/v1/quizzes/import/",
  importGoogleDoc: "/api/v1/quizzes/import-google-doc/",
  importGoogleForm: "/api/v1/quizzes/import-google-form/",
  template: "/api/v1/quizzes/template/",
});
