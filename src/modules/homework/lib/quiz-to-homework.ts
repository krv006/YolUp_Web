import type { QuizQuestion, QuizQuestionType } from "@/shared/types";
import { emptyQuestion, type DraftQuestion } from "./homework-questions";

export interface QuizConversion {
  /** Vazifaga olinadigan savollar (nusxa: testga bog'lanmaydi). */
  drafts: DraftQuestion[];
  /** Vazifa turlariga mos kelmagani uchun tushib qolgan savollar soni, tur bo'yicha. */
  skipped: Partial<Record<QuizQuestionType, number>>;
  /** Rasmi bor savollar soni (vazifa savollarida rasm yo'q — matni olinadi, rasm tushib qoladi). */
  withImage: number;
}

/** Test turi -> vazifa turi. `null` — vazifada bunday tur yo'q (juftlash, tartiblash, bo'sh joy). */
export const HOMEWORK_TYPE_OF_QUIZ: Record<QuizQuestionType, "single" | "multiple" | "short" | "long" | null> = {
  single: "single",
  multiple: "multiple",
  true_false: "single",
  numeric: "short",
  text: "short",
  essay: "long",
  matching: null,
  ordering: null,
  fill_blank: null,
};

/**
 * Test savollarini vazifa savollariga NUSXALAYDI (testga bog'lanmaydi): bitta/ko'p javobli — o'zi, "to'g'ri/noto'g'ri" —
 * ikki variantli bitta javobli, son/matn — qisqa javob, insho — uzun javob. Qolgan turlar tushib qoladi va soni qaytariladi.
 * `indexes` berilsa — faqat shu tartib raqamli savollar olinadi (o'qituvchi tanlagani).
 */
export function quizQuestionsToDrafts(
  questions: QuizQuestion[],
  labels: { trueLabel: string; falseLabel: string },
  indexes?: ReadonlySet<number>
): QuizConversion {
  const drafts: DraftQuestion[] = [];
  const skipped: Partial<Record<QuizQuestionType, number>> = {};
  let withImage = 0;
  questions.forEach((question, index) => {
    const target = HOMEWORK_TYPE_OF_QUIZ[question.type];
    if (!target) {
      skipped[question.type] = (skipped[question.type] ?? 0) + 1;
      return;
    }
    if (indexes && !indexes.has(index)) return;
    if (question.image) withImage += 1;
    const draft = emptyQuestion(target);
    draft.text = [question.text, question.textAfter].filter((part) => part && part.trim()).join("\n").trim();
    draft.points = Math.min(1000, Math.max(1, Math.round(question.points || 1)));
    if (question.type === "true_false") {
      draft.options = [labels.trueLabel, labels.falseLabel];
      const key = question.answerKey?.correctBool;
      draft.correct = key === undefined ? [] : [key ? 0 : 1];
    } else if (target === "single" || target === "multiple") {
      draft.options = question.options.map((option) => option.text);
      draft.correct = question.options.flatMap((option, position) => (option.isCorrect ? [position] : []));
      if (target === "single") draft.correct = draft.correct.slice(0, 1);
    }
    drafts.push(draft);
  });
  return { drafts, skipped, withImage };
}
