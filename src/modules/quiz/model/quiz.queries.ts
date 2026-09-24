import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { downloadBlob } from "@/shared/lib";
import type { QuizEditValues, QuizFormValues } from "@/shared/types";
import type { QuizAttemptAnswerInput } from "../lib/quiz.mappers";
import { quizApi } from "../api/quiz.api";
import type { QuizImportRequest } from "../api/quiz.dto";

export const quizKeys = Object.freeze({
  all: ["quizzes"] as const,
  list: (courseId: string | null) => ["quizzes", "list", courseId] as const,
  detail: (id: string) => ["quizzes", "detail", id] as const,
  attempts: (id: string) => ["quizzes", "attempts", id] as const,
});

export function useQuizzes(courseId: string | null, enabled = true) {
  return useQuery({
    queryKey: quizKeys.list(courseId),
    queryFn: ({ signal }) => quizApi.getAll(courseId, { signal }),
    enabled,
  });
}

export function useQuiz(id: string | null) {
  return useQuery({
    queryKey: quizKeys.detail(id ?? ""),
    queryFn: ({ signal }) => quizApi.getById(id as string, { signal }),
    enabled: Boolean(id),
  });
}

export function useQuizDetailLoader() {
  const client = useQueryClient();
  return (id: string) =>
    client.fetchQuery({
      queryKey: quizKeys.detail(id),
      queryFn: ({ signal }) => quizApi.getById(id, { signal }),
    });
}

export function useCreateQuiz() {
  const { t } = useTranslation("quiz");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: QuizFormValues) => quizApi.create(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      toast.success(t("toast.created"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateQuiz() {
  const { t } = useTranslation("quiz");
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: QuizEditValues }) => quizApi.update(id, values),
    onSuccess: (quiz) => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      client.setQueryData(quizKeys.detail(quiz.id), quiz);
      toast.success(t("toast.updated"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useImportQuizDocx() {
  const { t } = useTranslation("quiz");
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ file, request }: { file: File; request: QuizImportRequest }) =>
      quizApi.importDocx(file, request),
    onSuccess: (result) => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      toast.success(t("toast.importSuccess", { count: result.quiz.questions.length }));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useImportGoogleLink() {
  const { t } = useTranslation("quiz");
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      source,
      url,
      request,
    }: {
      source: "google_doc" | "google_form";
      url: string;
      request: QuizImportRequest;
    }) => quizApi.importGoogleLink(source, url, request),
    onSuccess: (result) => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      toast.success(t("toast.importSuccess", { count: result.quiz.questions.length }));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function usePublishQuiz() {
  const { t } = useTranslation("quiz");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.publish(id),
    onSuccess: (quiz) => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      client.setQueryData(quizKeys.detail(quiz.id), quiz);
      toast.success(t("toast.published"));
    },
  });
}

export function useDownloadQuizTemplate() {
  const { t } = useTranslation("quiz");
  return useMutation({
    mutationFn: ({ type, count }: { type: "docx" | "xlsx"; count: number }) =>
      quizApi.downloadTemplate(type, count).then((blob) =>
        downloadBlob(blob, t("createDialog.templateFileName", { ext: type }))
      ),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteQuiz() {
  const { t } = useTranslation("quiz");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.remove(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      toast.success(t("toast.deleted"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSubmitQuizAttempt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      quizId,
      answers,
    }: {
      quizId: string;
      answers: QuizAttemptAnswerInput[];
    }) => quizApi.submitAttempt(quizId, answers),
    onSuccess: (result) => {
      client.invalidateQueries({ queryKey: quizKeys.attempts(result.quizId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useQuizAttempts(quizId: string | null, enabled = true) {
  return useQuery({
    queryKey: quizKeys.attempts(quizId ?? ""),
    queryFn: ({ signal }) => quizApi.getAttempts(quizId as string, { signal }),
    enabled: Boolean(quizId) && enabled,
  });
}
