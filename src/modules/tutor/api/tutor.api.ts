import { apiClient } from "@/shared/api";
import { i18n } from "@/shared/i18n";
import { mapAiExplanation, mapPracticeSet } from "../lib/tutor.mappers";
import { tutorEndpoints } from "./tutor.endpoints";
import type { AiExplanationDto, ExplainRequest, PracticeRequest, PracticeSetDto } from "./tutor.dto";

export const tutorApi = {
  async practice(input: PracticeRequest) {
    return mapPracticeSet(
      await apiClient.post<PracticeSetDto>(tutorEndpoints.practice, {
        topic: input.topic,
        count: input.count,
        material: input.material || undefined,
        language: i18n.language,
      })
    );
  },
  async explain(input: ExplainRequest) {
    return mapAiExplanation(
      await apiClient.post<AiExplanationDto>(tutorEndpoints.explain, {
        question: input.question,
        wrong_answer: input.wrongAnswer || undefined,
        correct_answer: input.correctAnswer || undefined,
        language: i18n.language,
      })
    );
  },
};
