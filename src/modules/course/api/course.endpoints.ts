export const courseEndpoints = Object.freeze({
  list: "/api/v1/courses/",
  detail: (id: string) => `/api/v1/courses/${id}/`,
  catalog: "/api/v1/courses/catalog/",
  subjects: "/api/v1/courses/subjects/",
  students: (id: string) => `/api/v1/courses/${id}/students/`,
  searchStudents: (id: string) => `/api/v1/courses/${id}/search-students/`,
  enroll: (id: string) => `/api/v1/courses/${id}/enroll/`,
  unenroll: (id: string) => `/api/v1/courses/${id}/unenroll/`,
  inviteLink: (id: string) => `/api/v1/courses/${id}/invite-link/`,
  join: "/api/v1/courses/join/",
  requests: "/api/v1/courses/requests/",
  respondRequest: "/api/v1/courses/requests/respond/",
});
