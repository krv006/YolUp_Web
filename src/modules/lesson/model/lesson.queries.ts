import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppError, type QueryParams } from "@/shared/api";
import { describeCreateError } from "@/modules/auth";
import { lessonApi } from "../api/lesson.api";
import { flushTeacherAudioRecording } from "../lib/teacher-audio-recording";
import { flushTeacherVideoRecording } from "../lib/teacher-video-recording";
import type { LessonFormInput, LessonRatingInput } from "../api/lesson.dto";
import { addMinutesToTime, toBackendWeekdays, weeksBetween } from "../lib/lesson-schedule";

export const lessonKeys = Object.freeze({
  all: ["lessons"] as const,
  list: (params: QueryParams = {}) => ["lessons", "list", params] as const,
  detail: (id: string) => ["lessons", "detail", id] as const,
  recording: (id: string) => ["lessons", "recording", id] as const,
  ratings: (id: string) => ["lessons", "ratings", id] as const,
});

const RECORDING_POLL_MS = 15_000;
const MERGING_POLL_MS = 2_000;

export function useLessons(params: QueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: lessonKeys.list(params),
    queryFn: ({ signal }) => lessonApi.getAll({ signal, query: params }),
    select: (page) => page.items,
    enabled,
  });
}

const LIVE_POLL_MS = 20_000;

export function useLiveLesson(courseId: string | null) {
  const params: QueryParams = { course: courseId, status: "live", page_size: 5 };
  return useQuery({
    queryKey: lessonKeys.list(params),
    queryFn: ({ signal }) => lessonApi.getAll({ signal, query: params }),
    select: (page) => page.items[0] ?? null,
    enabled: Boolean(courseId),
    refetchInterval: LIVE_POLL_MS,
  });
}

export function useLiveLessons(enabled = true) {
  const params: QueryParams = { status: "live", page_size: 50 };
  return useQuery({
    queryKey: lessonKeys.list(params),
    queryFn: ({ signal }) => lessonApi.getAll({ signal, query: params }),
    select: (page) => page.items.filter((lesson) => lesson.status === "live"),
    enabled,
    refetchInterval: LIVE_POLL_MS,
  });
}

export function useLessonPage(params: QueryParams = {}) {
  return useQuery({
    queryKey: lessonKeys.list(params),
    queryFn: ({ signal }) => lessonApi.getAll({ signal, query: params }),
  });
}

export function useLesson(id: string | null, refetchInterval: number | false = false) {
  return useQuery({
    queryKey: lessonKeys.detail(id ?? ""),
    queryFn: ({ signal }) => lessonApi.getById(id as string, { signal }),
    enabled: Boolean(id),
    refetchInterval,
  });
}

export function useCreateLesson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: LessonFormInput) => lessonApi.create(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      toast.success("Dars saqlandi");
    },
    onError: (error) => toast.error(describeCreateError(error)),
  });
}

export interface LessonScheduleInput {
  courseId: string;
  title: string;
  time: string;
  durationMinutes: number;
  weekdays: number[];
  startsOn: string;
  endsOn: string;
  dates: string[];
}

export function useCreateLessonSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: LessonScheduleInput) => {
      const viaServer = await lessonApi.createSchedule(input.courseId, {
        title: input.title,
        days: toBackendWeekdays(input.weekdays),
        start_time: input.time,
        end_time: addMinutesToTime(input.time, input.durationMinutes),
        weeks: weeksBetween(input.startsOn, input.endsOn),
        start_date: input.startsOn,
      });

      if (viaServer) {
        return { created: viaServer.count, failed: [] as Array<{ date: string; message: string }> };
      }

      const local = await lessonApi.createMany(input.dates, {
        courseId: input.courseId,
        topic: input.title,
        time: input.time,
        duration: input.durationMinutes,
      });
      return { created: local.created.length, failed: local.failed };
    },
    onSuccess: ({ created, failed }) => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      if (!failed.length) {
        toast.success(`${created} ta dars jadvalga qo‘shildi`);
        return;
      }
      if (created) {
        toast.warning(`${created} ta dars qo‘shildi, ${failed.length} tasi saqlanmadi`);
        return;
      }
      toast.error("Darslarni saqlab bo‘lmadi");
    },
  });
}

export function useUpdateLesson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      form,
      scope,
    }: {
      id: string;
      form: LessonFormInput;
      scope?: "one" | "series";
    }) => lessonApi.update(id, form, scope),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      toast.success("Dars yangilandi");
    },
  });
}

export function useCancelLesson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scope = "one" }: { id: string; scope?: "one" | "series" }) =>
      lessonApi.cancel(id, scope),
    onSuccess: () => client.invalidateQueries({ queryKey: lessonKeys.all }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteLesson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lessonApi.remove(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      toast.success("Dars o‘chirildi");
    },
  });
}

export function useFinishLesson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, recordingTitle }: { id: string; recordingTitle?: string }) => {
      await Promise.all([flushTeacherAudioRecording(id), flushTeacherVideoRecording(id)]);
      const lesson = await lessonApi.finish(id, recordingTitle);
      const results = await Promise.allSettled([
        lessonApi.finalizeRecordingAudio(id),
        lessonApi.finalizeRecordingVideo(id),
      ]);
      results.forEach((result) => {
        if (result.status === "rejected" && !(result.reason instanceof AppError && result.reason.status === 400)) {
          throw result.reason;
        }
      });
      return lesson;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      toast.success("Dars yakunlandi — yozuv guruh chatiga tushadi");
    },
  });
}

export function useLessonRecording(id: string | null) {
  return useQuery({
    queryKey: lessonKeys.recording(id ?? ""),
    queryFn: ({ signal }) => lessonApi.getRecording(id as string, { signal }),
    enabled: Boolean(id),
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "merging") return MERGING_POLL_MS;
      if (status === "recording") return RECORDING_POLL_MS;
      return false;
    },
  });
}

export function useLessonWaiting(id: string | null, enabled = true) {
  return useQuery({
    queryKey: [...lessonKeys.detail(id ?? ""), "waiting"],
    queryFn: ({ signal }) => lessonApi.getWaiting(id as string, { signal }),
    enabled: Boolean(id) && enabled,
    refetchInterval: 15_000,
  });
}

export function useShareRecording(id: string | null) {
  return useMutation({
    mutationFn: () => lessonApi.shareRecording(id as string),
  });
}

export function useLessonConflicts(
  params: { start: string; duration: number; exclude?: string } | null
) {
  return useQuery({
    queryKey: ["lessons", "conflicts", params],
    queryFn: ({ signal }) => lessonApi.getConflicts(params!, { signal }),
    enabled: Boolean(params?.start && params?.duration),
    staleTime: 30_000,
  });
}

export function useDeleteRecording() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lessonApi.removeRecording(id),
    onSuccess: (id) => {
      client.invalidateQueries({ queryKey: lessonKeys.recording(id) });
      toast.success("Video yozuv o‘chirildi");
    },
  });
}

export function useLessonRatings(lessonId: string | null, enabled = true) {
  return useQuery({
    queryKey: lessonKeys.ratings(lessonId ?? ""),
    queryFn: ({ signal }) => lessonApi.getRatings(lessonId as string, { signal }),
    enabled: Boolean(lessonId) && enabled,
    retry: false,
  });
}

export function useLessonReminder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled, minutes }: { id: string; enabled: boolean; minutes?: number }) => {
      if (!enabled) {
        await lessonApi.clearReminder(id);
        return null;
      }
      return (await lessonApi.setReminder(id, minutes)).minutes_before;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: lessonKeys.all }),
  });
}

export function useRateLesson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LessonRatingInput }) =>
      lessonApi.rate(id, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      toast.success("Bahoyingiz uchun rahmat!");
    },
  });
}
