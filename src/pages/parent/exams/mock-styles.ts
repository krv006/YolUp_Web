export function sectionIcon(key: string, title: string): string {
  const name = `${key} ${title}`.toLowerCase();
  if (/listen|tingla/.test(name)) return "volume-up";
  if (/read|o.qish/.test(name)) return "menu-book";
  if (/writ|yoz/.test(name)) return "edit-note";
  if (/speak|gapir/.test(name)) return "mic";
  return "quiz";
}

export function band(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

export function bandTone(band: number): string {
  if (band >= 6.5) return "bg-success-bg text-success-text";
  if (band >= 5.5) return "bg-warning-bg text-warning-text";
  return "bg-danger-bg text-error-text";
}
