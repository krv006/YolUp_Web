export const BOARD_COLORS = ["#5b5cf0", "#e11d48", "#0f9d58", "#f59e0b", "#1c1e3a"] as const;
export const BOARD_WIDTHS = [2, 4, 8, 14] as const;
export const MOBILE_BOARD_COLORS = ["#24264d", "#4567f5", "#e5484d", "#1f9d62", "#faa81a", "#8c4dd9"] as const;
export const MOBILE_BOARD_WIDTHS = [2, 4, 8] as const;

export const BOARD_TEXT_SIZE = 22;

export const BOARD_SIZE_LIMITS = { min: 12, max: 48 } as const;
export const CODE_TEXT_SIZE = 20;
export const CODE_MAX_CHARS = 6000;
export const DEFAULT_CODE_LANGUAGES = [
  { id: "auto", label: "Avto" },
  { id: "sql", label: "SQL" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "java", label: "Java" },
  { id: "csharp", label: "C#" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "php", label: "PHP" },
  { id: "json", label: "JSON" },
  { id: "bash", label: "Bash" },
  { id: "plaintext", label: "Oddiy matn" },
] as const;
