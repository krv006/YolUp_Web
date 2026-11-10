import { useState } from "react";
import type { HomeworkQuestion } from "@/shared/types";
import type { HomeworkQuestionInput } from "../api/homework.dto";
import { draftsFromQuestions, questionIssue, toQuestionInputs, type DraftQuestion } from "../lib/homework-questions";

export interface QuestionDraftsOptions {
  editing?: boolean;
  locked?: boolean;
}

export function useQuestionDrafts(initial: HomeworkQuestion[] = [], { editing = false, locked = false }: QuestionDraftsOptions = {}) {
  const [drafts, setDraftsState] = useState<DraftQuestion[]>(() => draftsFromQuestions(initial));
  const [dirty, setDirty] = useState(false);
  const [showIssues, setShowIssues] = useState(false);

  function setDrafts(next: DraftQuestion[]) {
    setDraftsState(next);
    setDirty(true);
  }

  function validate(): boolean {
    if (locked) return true;
    const invalid = drafts.some((draft) => questionIssue(draft) !== null);
    setShowIssues(invalid);
    return !invalid;
  }

  function payload(): HomeworkQuestionInput[] | undefined {
    if (locked || (editing && !dirty) || (!editing && !drafts.length)) return undefined;
    return toQuestionInputs(drafts);
  }

  function reset(next: HomeworkQuestion[] = []) {
    setDraftsState(draftsFromQuestions(next));
    setDirty(false);
    setShowIssues(false);
  }

  return { drafts, setDrafts, showIssues, validate, payload, reset, locked };
}
