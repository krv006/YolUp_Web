export function localDay(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function emailSetupOverdue(deadline: string | null, today = localDay()): boolean {
  return Boolean(deadline) && today > (deadline as string);
}

export function formatDeadline(deadline: string): string {
  const [year, month, day] = deadline.split("-");
  return year && month && day ? `${day}.${month}.${year}` : deadline;
}

const ROLE_ROOTS = ["teacher", "student", "parent"];
const BANNER_HIDDEN = ["notifications", "search"];

export function emailBannerAllowed(pathname: string): boolean {
  const [role, tab, ...rest] = pathname.split("/").filter(Boolean);
  return ROLE_ROOTS.includes(role ?? "") && !rest.length && !BANNER_HIDDEN.includes(tab ?? "");
}
