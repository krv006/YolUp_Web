export const attendanceEndpoints = Object.freeze({
  list: "/api/v1/attendance/",
  detail: (id: string) => `/api/v1/attendance/${id}/`,
  summary: (courseId: string) => `/api/v1/courses/${courseId}/attendance/summary/`,
});
