export const materialEndpoints = Object.freeze({
  list: "/api/v1/materials/",
  detail: (id: string) => `/api/v1/materials/${id}/`,
  file: (id: string) => `/api/v1/materials/${id}/file/`,
  courses: "/api/v1/materials/courses/",
  courseLessons: (courseId: string) => `/api/v1/materials/courses/${courseId}/lessons/`,
  lessonFolder: (lessonId: string) => `/api/v1/materials/lessons/${lessonId}/`,
  boardPdf: (lessonId: string) => `/api/v1/materials/lessons/${lessonId}/board.pdf`,
});
