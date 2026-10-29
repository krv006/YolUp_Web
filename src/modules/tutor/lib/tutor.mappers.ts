import type { AiExplanation, PracticeSet } from "@/shared/types";
import type { AiExplanationDto, PracticeSetDto } from "../api/tutor.dto";

export function mapPracticeSet(dto: PracticeSetDto): PracticeSet {
  return {
    topic: dto.topic ?? "",
    questions: (dto.questions ?? [])
      .map((item) => ({
        text: item.text ?? "",
        options: item.options ?? [],
        correctIndex: Number(item.correct_index ?? 0),
        explanation: item.explanation ?? "",
      }))
      .filter((item) => item.text && item.options.length > 1),
    used: dto.used ?? null,
    limit: dto.limit ?? null,
  };
}

export function mapAiExplanation(dto: AiExplanationDto): AiExplanation {
  return {
    explanation: dto.explanation ?? "",
    tip: dto.tip ?? "",
    used: dto.used ?? null,
    limit: dto.limit ?? null,
  };
}
