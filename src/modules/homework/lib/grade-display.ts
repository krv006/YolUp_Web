export function formatGradeValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

export function gradePercent(value: number, maxScore: number): number {
  return maxScore > 0 ? Math.max(0, Math.min(100, Math.round((value / maxScore) * 100))) : 0;
}
