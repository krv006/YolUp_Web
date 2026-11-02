export interface PasswordStrength {
  length: boolean;
  digit: boolean;
  cases: boolean;
  level: "weak" | "medium" | "strong";
  score: number;
}

export function passwordStrength(value: string): PasswordStrength {
  const length = value.length >= 8;
  const digit = /\d/.test(value);
  const cases = /[a-z]/.test(value) && /[A-Z]/.test(value);
  const score = [length, digit, cases, value.length >= 12].filter(Boolean).length;
  return { length, digit, cases, score, level: !length || !digit ? "weak" : score >= 4 ? "strong" : "medium" };
}
