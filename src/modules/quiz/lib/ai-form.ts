import type { AiQuizJobStatus } from "../api/quiz.dto";

export const AI_MIN_QUESTIONS = 5;
export const AI_MAX_QUESTIONS = 60;
export const AI_DEFAULT_QUESTIONS = 20;

/** Tez tanlash uchun imtihon formatlari; «Boshqa imtihon…» orqali har qanday nom yoziladi. */
export const AI_EXAM_FORMATS = [
  "IELTS Academic Reading",
  "IELTS General Training Reading",
  "IELTS Listening",
  "IELTS Writing",
  "SAT Reading and Writing",
  "SAT Math",
  "TOEFL iBT Reading",
  "Cambridge B2 First (FCE) Reading",
  "CEFR B1",
  "Milliy sertifikat (matematika)",
  "DTM test",
] as const;

export type AiFormProblem = "needMaterial" | "enterExam" | "countRange";

export function checkAiForm(input: {
  fileCount: number;
  text: string;
  topic: string;
  simple: boolean;
  examName: string;
  count: number;
}): AiFormProblem | null {
  if (!input.fileCount && !input.text.trim() && !input.topic.trim()) return "needMaterial";
  if (!input.simple && !input.examName.trim()) return "enterExam";
  if (input.simple && !(input.count >= AI_MIN_QUESTIONS && input.count <= AI_MAX_QUESTIONS)) return "countRange";
  return null;
}

/** Ish holatidan jarayon qadami (0 — material, 1 — savollar yozilmoqda, 2 — saqlanmoqda). */
export function aiJobStep(status: AiQuizJobStatus): number {
  if (status === "generating") return 1;
  if (status === "done") return 3;
  return 0;
}

export function isAiJobActive(status: AiQuizJobStatus): boolean {
  return status === "queued" || status === "processing" || status === "generating";
}
