import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { downloadBlob } from "@/shared/lib";
import type { QuizFormValues } from "@/shared/types";
import type { QuizAttemptAnswerInput } from "../lib/quiz.mappers";
import { quizApi } from "../api/quiz.api";

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
    onSuccess: (quiz) => {
      client.invalidateQueries({ queryKey: quizKeys.list(quiz.courseId) });
      toast.success(t("toast.created"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useImportQuizDocx() {
  const { t } = useTranslation("quiz");
  return useMutation({
    mutationFn: (file: File) => quizApi.importDocx(file),
    onSuccess: (preview) => toast.success(t("toast.importSuccess", { count: preview.questions.length })),
    onError: (error: Error) => toast.error(error.message),
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
