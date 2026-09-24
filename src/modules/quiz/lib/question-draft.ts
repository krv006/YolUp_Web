import type {
  QuizChoiceItem,
  QuizOption,
  QuizQuestion,
  QuizQuestionFormValues,
  QuizQuestionType,
} from "@/shared/types";
import { stableShuffle } from "./answer-value";

export const DEFAULT_POINTS = 2;
export const MIN_POINTS = 1;
export const MAX_POINTS = 100;
export const DEFAULT_OPTION_COUNT = 4;
export const MAX_OPTIONS = 8;

export const QUESTION_TYPE_ORDER: QuizQuestionType[] = [
  "single",
  "multiple",
  "true_false",
  "numeric",
  "text",
  "matching",
  "ordering",
  "fill_blank",
];

export interface DraftOption {
  key: string;
  text: string;
}

export interface DraftPair {
  key: string;
  left: string;
  right: string;
}

export interface QuestionDraft {
  key: string;
  type: QuizQuestionType;
  text: string;
  points: string;
  options: DraftOption[];
  correctKeys: string[];
  correctBool: boolean | null;
  acceptedAnswers: string[];
  tolerance: string;
  caseSensitive: boolean;
  pairs: DraftPair[];
}

export type KeyFactory = () => string;

export type DraftError =
  | "questionTextRequired"
  | "pointsInvalid"
  | "minTwoOptions"
  | "allOptionsRequired"
  | "markCorrect"
  | "markAtLeastOneCorrect"
  | "chooseTrueFalse"
  | "numericAnswerRequired"
  | "numericAnswerInvalid"
  | "toleranceInvalid"
  | "textAnswerRequired"
  | "minTwoPairs"
  | "allPairsRequired"
  | "pairsMustBeUnique"
  | "minTwoItems"
  | "allItemsRequired"
  | "blankRequired"
  | "blankAnswerRequired";

const BLANK_PATTERN = /\{\{([^{}]*)\}\}/g;

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function emptyOptions(newKey: KeyFactory, count = DEFAULT_OPTION_COUNT): DraftOption[] {
  return Array.from({ length: count }, () => ({ key: newKey(), text: "" }));
}

function emptyPairs(newKey: KeyFactory, count = 3): DraftPair[] {
  return Array.from({ length: count }, () => ({ key: newKey(), left: "", right: "" }));
}

export function createDraft(type: QuizQuestionType, newKey: KeyFactory): QuestionDraft {
  return {
    key: newKey(),
    type,
    text: "",
    points: String(DEFAULT_POINTS),
    options: type === "ordering" ? emptyOptions(newKey, 3) : emptyOptions(newKey),
    correctKeys: [],
    correctBool: null,
    acceptedAnswers: [""],
    tolerance: "",
    caseSensitive: false,
    pairs: emptyPairs(newKey),
  };
}

export function changeDraftType(
  draft: QuestionDraft,
  type: QuizQuestionType,
  newKey: KeyFactory
): QuestionDraft {
  if (draft.type === type) return draft;
  const choiceTypes: QuizQuestionType[] = ["single", "multiple", "ordering"];
  const keepOptions = choiceTypes.includes(draft.type) && choiceTypes.includes(type);
  const fresh = createDraft(type, newKey);
  return {
    ...fresh,
    key: draft.key,
    text: type === "fill_blank" || draft.type === "fill_blank" ? draft.text.replace(BLANK_PATTERN, "$1") : draft.text,
    points: draft.points,
    options: keepOptions ? draft.options : fresh.options,
    correctKeys: type === "single" ? draft.correctKeys.slice(0, 1) : type === "multiple" ? draft.correctKeys : [],
  };
}

export interface BlankSegment {
  kind: "text" | "blank";
  value: string;
  index: number;
}

export function parseBlankTemplate(text: string): BlankSegment[] {
  const segments: BlankSegment[] = [];
  let lastIndex = 0;
  let blankIndex = 0;
  for (const match of text.matchAll(BLANK_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) segments.push({ kind: "text", value: text.slice(lastIndex, start), index: -1 });
    segments.push({ kind: "blank", value: match[1], index: blankIndex });
    blankIndex += 1;
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ kind: "text", value: text.slice(lastIndex), index: -1 });
  return segments;
}

export function splitAnswerVariants(raw: string): string[] {
  return raw
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function blankTemplateToNumbered(text: string): { text: string; blanks: Array<{ answers: string[] }> } {
  const blanks: Array<{ answers: string[] }> = [];
  const numbered = text.replace(BLANK_PATTERN, (_match, inner: string) => {
    blanks.push({ answers: splitAnswerVariants(inner) });
    return `{{${blanks.length}}}`;
  });
  return { text: numbered, blanks };
}

export function numberedToBlankTemplate(text: string, blanks: Array<{ answers: string[] }>): string {
  return text.replace(/\{\{(\d+)\}\}/g, (match, digits: string) => {
    const blank = blanks[Number(digits) - 1];
    return blank ? `{{${blank.answers.join(" | ")}}}` : match;
  });
}

export function parseNumber(raw: string): number | null {
  const normalized = raw.trim().replace(/\s+/g, "").replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function draftPoints(draft: QuestionDraft): number | null {
  const value = Number(draft.points);
  if (!Number.isInteger(value) || value < MIN_POINTS || value > MAX_POINTS) return null;
  return value;
}

const ANSWER_ERRORS: ReadonlySet<DraftError> = new Set<DraftError>([
  "markCorrect",
  "markAtLeastOneCorrect",
  "chooseTrueFalse",
  "numericAnswerRequired",
  "textAnswerRequired",
  "blankAnswerRequired",
]);

export function validateDraft(
  draft: QuestionDraft,
  { allowMissingAnswer = false }: { allowMissingAnswer?: boolean } = {}
): DraftError | null {
  const error = checkDraft(draft);
  if (error && allowMissingAnswer && ANSWER_ERRORS.has(error)) return null;
  return error;
}

function checkDraft(draft: QuestionDraft): DraftError | null {
  if (!draft.text.trim()) return "questionTextRequired";
  if (draftPoints(draft) === null) return "pointsInvalid";
  switch (draft.type) {
    case "single":
    case "multiple":
      if (draft.options.length < 2) return "minTwoOptions";
      if (draft.options.some((option) => !option.text.trim())) return "allOptionsRequired";
      if (draft.type === "single" && draft.correctKeys.length !== 1) return "markCorrect";
      if (draft.type === "multiple" && !draft.correctKeys.length) return "markAtLeastOneCorrect";
      return null;
    case "true_false":
      return draft.correctBool === null ? "chooseTrueFalse" : null;
    case "numeric": {
      const answers = draft.acceptedAnswers.filter((value) => value.trim());
      if (!answers.length) return "numericAnswerRequired";
      if (answers.some((value) => parseNumber(value) === null)) return "numericAnswerInvalid";
      if (draft.tolerance.trim()) {
        const tolerance = parseNumber(draft.tolerance);
        if (tolerance === null || tolerance < 0) return "toleranceInvalid";
      }
      return null;
    }
    case "text":
      return draft.acceptedAnswers.some((value) => value.trim()) ? null : "textAnswerRequired";
    case "matching": {
      if (draft.pairs.length < 2) return "minTwoPairs";
      if (draft.pairs.some((pair) => !pair.left.trim() || !pair.right.trim())) return "allPairsRequired";
      const lefts = new Set(draft.pairs.map((pair) => pair.left.trim().toLowerCase()));
      const rights = new Set(draft.pairs.map((pair) => pair.right.trim().toLowerCase()));
      if (lefts.size !== draft.pairs.length || rights.size !== draft.pairs.length) return "pairsMustBeUnique";
      return null;
    }
    case "ordering":
      if (draft.options.length < 2) return "minTwoItems";
      return draft.options.some((option) => !option.text.trim()) ? "allItemsRequired" : null;
    case "fill_blank": {
      const blanks = parseBlankTemplate(draft.text).filter((segment) => segment.kind === "blank");
      if (!blanks.length) return "blankRequired";
      return blanks.some((blank) => !splitAnswerVariants(blank.value).length) ? "blankAnswerRequired" : null;
    }
    default:
      return null;
  }
}

export function draftToFormValues(draft: QuestionDraft): QuizQuestionFormValues {
  const base = {
    type: draft.type,
    text: draft.text.trim(),
    points: draftPoints(draft) ?? DEFAULT_POINTS,
    options: [] as QuizQuestionFormValues["options"],
  };
  switch (draft.type) {
    case "single":
    case "multiple":
      return {
        ...base,
        options: draft.options.map((option) => ({
          text: option.text.trim(),
          isCorrect: draft.correctKeys.includes(option.key),
        })),
      };
    case "true_false":
      return { ...base, correctBool: Boolean(draft.correctBool) };
    case "numeric":
      return {
        ...base,
        acceptedAnswers: draft.acceptedAnswers
          .map((value) => parseNumber(value))
          .filter((value): value is number => value !== null)
          .map(String),
        tolerance: parseNumber(draft.tolerance) ?? 0,
      };
    case "text":
      return {
        ...base,
        acceptedAnswers: draft.acceptedAnswers.map((value) => value.trim()).filter(Boolean),
        caseSensitive: draft.caseSensitive,
      };
    case "matching":
      return {
        ...base,
        pairs: draft.pairs.map((pair) => ({ left: pair.left.trim(), right: pair.right.trim() })),
      };
    case "ordering":
      return { ...base, items: draft.options.map((option) => option.text.trim()) };
    case "fill_blank": {
      const { text, blanks } = blankTemplateToNumbered(draft.text.trim());
      return { ...base, text, blanks };
    }
    default:
      return base;
  }
}

export function formValuesToDraft(values: QuizQuestionFormValues, newKey: KeyFactory): QuestionDraft {
  const draft = createDraft(values.type, newKey);
  const options = values.options.map((option) => ({ key: newKey(), text: option.text }));
  return {
    ...draft,
    text: values.text,
    points: String(values.points || DEFAULT_POINTS),
    options: options.length ? options : draft.options,
    correctKeys: values.options.flatMap((option, index) => (option.isCorrect ? [options[index].key] : [])),
  };
}

export function questionToDraft(question: QuizQuestion, newKey: KeyFactory): QuestionDraft {
  const draft = createDraft(question.type, newKey);
  const key = question.answerKey ?? {};
  const options = question.options.map((option) => ({ key: newKey(), text: option.text }));
  const base: QuestionDraft = { ...draft, text: question.text, points: String(question.points || DEFAULT_POINTS) };
  switch (question.type) {
    case "single":
    case "multiple":
      return {
        ...base,
        options: options.length ? options : draft.options,
        correctKeys: question.options.flatMap((option, index) => (option.isCorrect ? [options[index].key] : [])),
      };
    case "true_false":
      return { ...base, correctBool: key.correctBool ?? null };
    case "numeric":
      return {
        ...base,
        acceptedAnswers: key.acceptedAnswers?.length ? key.acceptedAnswers : [""],
        tolerance: key.tolerance ? String(key.tolerance) : "",
      };
    case "text":
      return {
        ...base,
        acceptedAnswers: key.acceptedAnswers?.length ? key.acceptedAnswers : [""],
        caseSensitive: Boolean(key.caseSensitive),
      };
    case "matching":
      return {
        ...base,
        pairs: key.pairs?.length
          ? key.pairs.map((pair) => ({ key: newKey(), left: pair.left, right: pair.right }))
          : draft.pairs,
      };
    case "ordering":
      return {
        ...base,
        options: key.items?.length ? key.items.map((text) => ({ key: newKey(), text })) : options,
      };
    case "fill_blank":
      return { ...base, text: numberedToBlankTemplate(question.text, key.blanks ?? []) };
    default:
      return base;
  }
}

function toItems(values: string[], prefix: string): QuizChoiceItem[] {
  return values.map((text, index) => ({ id: `${prefix}${index}`, text }));
}

export function draftToStudentQuestion(draft: QuestionDraft, index: number): QuizQuestion {
  const options: QuizOption[] = draft.options.map((option) => ({ id: option.key, text: option.text }));
  const common = {
    id: draft.key,
    type: draft.type,
    text: draft.text,
    points: draftPoints(draft) ?? DEFAULT_POINTS,
    order: index,
    options: [] as QuizOption[],
    matchLeft: [] as QuizChoiceItem[],
    matchRight: [] as QuizChoiceItem[],
    blankCount: 0,
  };
  switch (draft.type) {
    case "single":
    case "multiple":
      return { ...common, options };
    case "ordering":
      return { ...common, options: stableShuffle(options, draft.key) };
    case "matching":
      return {
        ...common,
        matchLeft: toItems(draft.pairs.map((pair) => pair.left), `${draft.key}-l`),
        matchRight: stableShuffle(toItems(draft.pairs.map((pair) => pair.right), `${draft.key}-r`), draft.key),
      };
    case "fill_blank": {
      const { text, blanks } = blankTemplateToNumbered(draft.text);
      return { ...common, text, blankCount: blanks.length };
    }
    default:
      return common;
  }
}

export function hasDraftContent(draft: QuestionDraft): boolean {
  return Boolean(
    draft.text.trim() ||
      draft.options.some((option) => option.text.trim()) ||
      draft.pairs.some((pair) => pair.left.trim() || pair.right.trim()) ||
      draft.acceptedAnswers.some((value) => value.trim())
  );
}
