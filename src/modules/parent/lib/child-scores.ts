export type ScoreRange = "8w" | "6m" | "all";
export type ScoreKind = "overall" | "homework" | "quiz" | "exam";

type ScoreValues = Partial<Record<ScoreKind, number | null>>;

export interface ChildScoresDto {
  range?: ScoreRange;
  scale?: number;
  period_type?: "week" | "month";
  summary?: ScoreValues & { count?: number };
  periods?: Array<ScoreValues & { start: string; count?: number }>;
  points?: Array<{ date: string; kind: Exclude<ScoreKind, "overall">; title?: string; score_10?: number | null }>;
}

export interface ScorePeriod {
  start: string;
  values: Record<ScoreKind, number | null>;
  count: number;
}

export interface ChildScores {
  range: ScoreRange;
  periodType: "week" | "month";
  summary: Record<ScoreKind, number | null>;
  count: number;
  periods: ScorePeriod[];
}

export const SCORE_KINDS: ScoreKind[] = ["overall", "homework", "quiz", "exam"];

function values(source: ScoreValues | undefined): Record<ScoreKind, number | null> {
  return {
    overall: source?.overall ?? null,
    homework: source?.homework ?? null,
    quiz: source?.quiz ?? null,
    exam: source?.exam ?? null,
  };
}

export function mapChildScores(dto: ChildScoresDto, range: ScoreRange): ChildScores {
  return {
    range: dto.range ?? range,
    periodType: dto.period_type === "month" ? "month" : "week",
    summary: values(dto.summary),
    count: Number(dto.summary?.count ?? 0),
    periods: (dto.periods ?? []).map((period) => ({
      start: period.start,
      values: values(period),
      count: Number(period.count ?? 0),
    })),
  };
}

export function scoreSeries(scores: ChildScores, kind: ScoreKind): Array<number | null> {
  return scores.periods.map((period) => period.values[kind]);
}
