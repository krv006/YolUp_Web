export const AI_MATERIAL_EXTENSIONS = ["pdf", "docx", "pptx", "xlsx", "xlsm", "csv", "txt", "md"] as const;
export const AI_MATERIAL_ACCEPT = AI_MATERIAL_EXTENSIONS.map((extension) => `.${extension}`).join(",");
export const AI_MATERIAL_MAX_FILES = 5;
export const AI_MATERIAL_MAX_FILE_MB = 20;
export const AI_MATERIAL_MAX_TOTAL_MB = 40;

const MB = 1024 * 1024;

export type AiMaterialProblem =
  | { kind: "type"; name: string }
  | { kind: "fileSize"; name: string; max: number }
  | { kind: "count"; max: number }
  | { kind: "total"; max: number };

function extension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

export function checkAiMaterials(files: ReadonlyArray<Pick<File, "name" | "size">>): AiMaterialProblem | null {
  const allowed: readonly string[] = AI_MATERIAL_EXTENSIONS;
  const wrong = files.find((file) => !allowed.includes(extension(file.name)));
  if (wrong) return { kind: "type", name: wrong.name };
  const big = files.find((file) => file.size > AI_MATERIAL_MAX_FILE_MB * MB);
  if (big) return { kind: "fileSize", name: big.name, max: AI_MATERIAL_MAX_FILE_MB };
  if (files.length > AI_MATERIAL_MAX_FILES) return { kind: "count", max: AI_MATERIAL_MAX_FILES };
  if (files.reduce((sum, file) => sum + file.size, 0) > AI_MATERIAL_MAX_TOTAL_MB * MB) {
    return { kind: "total", max: AI_MATERIAL_MAX_TOTAL_MB };
  }
  return null;
}
