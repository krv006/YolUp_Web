import type { QuizQuestion } from "@/shared/types";
import { MathText } from "./math-text";

/** Savolning rasmi va rasmdan keyingi matni. Savol matni (rasmdan oldin) alohida ko'rsatiladi. */
export function QuestionMedia({ question }: { question: Pick<QuizQuestion, "image" | "textAfter"> }) {
  const after = question.textAfter?.trim() ?? "";
  if (!question.image && !after) return null;
  return (
    <div className="mt-3 flex flex-col gap-3">
      {question.image ? (
        <img
          src={question.image.url}
          alt=""
          loading="lazy"
          className="max-h-96 w-auto max-w-full self-start rounded-lg border border-line bg-surface object-contain"
        />
      ) : null}
      {after ? (
        <p className="text-body text-ink">
          <MathText text={after} />
        </p>
      ) : null}
    </div>
  );
}
