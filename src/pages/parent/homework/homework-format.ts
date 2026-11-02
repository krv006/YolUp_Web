export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileKind(name: string, mimeType = ""): "pdf" | "image" | "file" {
  if (mimeType.includes("pdf") || /\.pdf$/i.test(name)) return "pdf";
  if (mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|heic)$/i.test(name)) return "image";
  return "file";
}

export function resultTone(percent: number): "excellent" | "good" | "fair" | "low" {
  if (percent >= 85) return "excellent";
  if (percent >= 70) return "good";
  if (percent >= 50) return "fair";
  return "low";
}
