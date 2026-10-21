import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { QueryParams } from "@/shared/api";
import { describeCreateError, type CreateChildRequestDto } from "@/modules/auth";
import { courseApi } from "../api/course.api";
import type {
  CourseFormInput,
  CourseInviteLinkInput,
  EnrollmentAction,
  EnrollPayload,
} from "../api/course.dto";

export const courseKeys = Object.freeze({
  all: ["courses"] as const,
  lists: () => ["courses", "list"] as const,
  list: (params: QueryParams = {}) => ["courses", "list", params] as const,
  catalog: (params: QueryParams = {}) => ["courses", "catalog", params] as const,
  detail: (id: string) => ["courses", "detail", id] as const,
  students: (id: string, params: QueryParams = {}) => ["courses", id, "students", params] as const,
  searchStudents: (id: string, query: string) => ["courses", id, "search-students", query] as const,
  inviteLink: (id: string) => ["courses", id, "invite-link"] as const,
  presence: (id: string) => ["courses", id, "presence"] as const,
  requests: ["courses", "requests"] as const,
  subjects: ["courses", "subjects"] as const,
});

export function useSubjects(enabled = true) {
  return useQuery({
    queryKey: courseKeys.subjects,
    queryFn: ({ signal }) => courseApi.getSubjects({ signal }),
    staleTime: 30 * 60 * 1000,
    enabled,
  });
}

export function useCourses(params: QueryParams = {}) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: ({ signal }) => courseApi.getAll({ signal, query: params }),
    select: (data) => data.items,
  });
}

export function useCoursePage(params: QueryParams = {}) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: ({ signal }) => courseApi.getAll({ signal, query: params }),
  });
}

export function useCourseCatalog(params: QueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: courseKeys.catalog(params),
    queryFn: ({ signal }) => courseApi.getCatalog({ signal, query: params }),
    enabled,
  });
}

export function useCourse(id: string | null) {
  return useQuery({
    queryKey: courseKeys.detail(id ?? ""),
    queryFn: ({ signal }) => courseApi.getById(id as string, { signal }),
    enabled: Boolean(id),
  });
}

export function useCourseStudents(id: string | null, params: QueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: courseKeys.students(id ?? "", params),
    queryFn: ({ signal }) => courseApi.getStudents(id as string, { signal, query: params }),
    enabled: Boolean(id) && enabled,
  });
}

export function useCourseRequests(params: QueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: [...courseKeys.requests, params],
    queryFn: ({ signal }) => courseApi.getRequests({ signal, query: params }),
    enabled,
  });
}

export function useCreateCourse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: CourseFormInput) => courseApi.create(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Kurs yaratildi");
    },
    onError: (error) => toast.error(describeCreateError(error)),
  });
}

export function useUpdateCourse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: CourseFormInput }) => courseApi.update(id, form),
    onSuccess: (course) => {
      client.invalidateQueries({ queryKey: courseKeys.all });
      client.setQueryData(courseKeys.detail(course.id), course);
      toast.success("Kurs yangilandi");
    },
  });
}

export function useDeleteCourse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.remove(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Kurs o‘chirildi");
    },
  });
}

export function useCreateEnrollment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, payload }: { courseId: string; payload: EnrollPayload }) =>
      courseApi.enroll(courseId, payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Yozilish so‘rovi yuborildi");
    },
  });
}

export function useSearchCourseStudents(courseId: string | null, query: string) {
  const term = query.trim();
  return useQuery({
    queryKey: courseKeys.searchStudents(courseId ?? "", term),
    queryFn: ({ signal }) => courseApi.searchStudents(courseId as string, term, { signal }),
    enabled: Boolean(courseId) && term.length >= 2,
    staleTime: 15_000,
  });
}

export function useCreateCourseStudent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, form }: { courseId: string; form: CreateChildRequestDto }) =>
      courseApi.createStudent(courseId, form),
    onSuccess: (enrollment) => {
      client.invalidateQueries({ queryKey: courseKeys.all });
      toast.success(
        enrollment?.status === "approved"
          ? "O‘quvchi yaratildi va kursga qo‘shildi"
          : "O‘quvchi yaratildi, so‘rov yuborildi"
      );
    },
  });
}

export function useInviteLink(courseId: string | null, enabled = true) {
  return useQuery({
    queryKey: courseKeys.inviteLink(courseId ?? ""),
    queryFn: ({ signal }) => courseApi.getInviteLink(courseId as string, { signal }),
    enabled: Boolean(courseId) && enabled,
  });
}

export function useCreateInviteLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input?: CourseInviteLinkInput }) =>
      courseApi.createInviteLink(courseId, input),
    onSuccess: (link, variables) =>
      client.setQueryData(courseKeys.inviteLink(variables.courseId), link),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteInviteLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => courseApi.deleteInviteLink(courseId),
    onSuccess: (courseId) => client.setQueryData(courseKeys.inviteLink(courseId), null),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useJoinCourse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => courseApi.join(code),
    onSuccess: () => client.invalidateQueries({ queryKey: courseKeys.all }),
  });
}

export function useCourseStudentPresence(courseId: string | null, enabled = true) {
  return useQuery({
    queryKey: courseKeys.presence(courseId ?? ""),
    queryFn: ({ signal }) => courseApi.getStudentPresence(courseId as string, { signal }),
    enabled: Boolean(courseId) && enabled,
    staleTime: 15_000,
  });
}

export function useEnrollStudent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string | null; studentId: string }) =>
      courseApi.enroll(courseId as string, { student_id: studentId }),
    onSuccess: (enrollment) => {
      client.invalidateQueries({ queryKey: courseKeys.all });
      toast.success(
        enrollment?.status === "approved" ? "O‘quvchi kursga qo‘shildi" : "So‘rov yuborildi"
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUnenrollStudent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string | null; studentId: string }) =>
      courseApi.unenroll(courseId as string, studentId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("O‘quvchi kursdan chiqarildi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRespondCourseRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, action }: { enrollmentId: string; action: EnrollmentAction }) =>
      courseApi.respondRequest(enrollmentId, action),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Yozilish so‘rovi yangilandi");
    },
  });
}
