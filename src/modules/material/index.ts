export { materialApi } from "./api/material.api";
export type {
  LessonFolder,
  MaterialCourseFolder,
  MaterialCourseLessons,
  MaterialFilters,
  MaterialLessonFolder,
  MaterialUploadInput,
} from "./api/material.dto";
export {
  materialKeys,
  useDeleteMaterial,
  useLessonFolder,
  useMaterialCourses,
  useMaterialLessons,
  useMaterials,
  useUploadMaterial,
} from "./model/material.queries";
