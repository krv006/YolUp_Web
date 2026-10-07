export function describeCreateError(error: unknown): string {
  return error instanceof Error ? error.message : "Xatolik yuz berdi";
}
