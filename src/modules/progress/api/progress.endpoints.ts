export const progressEndpoints = Object.freeze({
  course: (courseId: string) => `/api/v1/courses/${courseId}/progress/`,
  student: (courseId: string, studentId: string) => `/api/v1/courses/${courseId}/students/${studentId}/progress/`,
  payment: (courseId: string, studentId: string, month: string) =>
    `/api/v1/courses/${courseId}/students/${studentId}/payments/${month}/`,
});
