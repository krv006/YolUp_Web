import { apiClient, type RequestOptions } from "@/shared/api";
import { mapCourseProgress, mapPayment, mapStudentProgressDetail } from "../lib/progress.mappers";
import type { CourseProgressDto, PaymentDto, ProgressRange, StudentProgressDetailDto } from "./progress.dto";
import { progressEndpoints } from "./progress.endpoints";

export const progressApi = {
  async getCourse(courseId: string, month: string | undefined, range: ProgressRange, options: RequestOptions = {}) {
    return mapCourseProgress(
      await apiClient.get<CourseProgressDto>(progressEndpoints.course(courseId), {
        ...options,
        query: month ? { range, month } : { range },
      })
    );
  },
  async getStudent(courseId: string, studentId: string, range: ProgressRange, options: RequestOptions = {}) {
    return mapStudentProgressDetail(
      await apiClient.get<StudentProgressDetailDto>(progressEndpoints.student(courseId, studentId), {
        ...options,
        query: { range },
      })
    );
  },
  async markPaid(courseId: string, studentId: string, month: string, body: { amount?: number; note?: string } = {}) {
    return mapPayment(await apiClient.put<PaymentDto>(progressEndpoints.payment(courseId, studentId, month), body));
  },
  async unmarkPaid(courseId: string, studentId: string, month: string) {
    await apiClient.delete(progressEndpoints.payment(courseId, studentId, month));
  },
};
