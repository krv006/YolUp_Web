import { apiClient, type RequestOptions } from "@/shared/api";
import { mapCourseProgress, mapPayment, mapStudentProgressDetail } from "../lib/progress.mappers";
import type { CourseProgressDto, PaymentDto, StudentProgressDetailDto } from "./progress.dto";
import { progressEndpoints } from "./progress.endpoints";

export const progressApi = {
  async getCourse(courseId: string, month: string | undefined, options: RequestOptions = {}) {
    return mapCourseProgress(
      await apiClient.get<CourseProgressDto>(progressEndpoints.course(courseId), {
        ...options,
        query: month ? { month } : undefined,
      })
    );
  },
  async getStudent(courseId: string, studentId: string, options: RequestOptions = {}) {
    return mapStudentProgressDetail(
      await apiClient.get<StudentProgressDetailDto>(progressEndpoints.student(courseId, studentId), options)
    );
  },
  async markPaid(courseId: string, studentId: string, month: string, body: { amount?: number; note?: string } = {}) {
    return mapPayment(await apiClient.put<PaymentDto>(progressEndpoints.payment(courseId, studentId, month), body));
  },
  async unmarkPaid(courseId: string, studentId: string, month: string) {
    await apiClient.delete(progressEndpoints.payment(courseId, studentId, month));
  },
};
