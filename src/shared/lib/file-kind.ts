import { i18n } from "@/shared/i18n";

export type FileKind = "pdf" | "image" | "video" | "audio" | "other";

const EXTENSION_KINDS: Array<[FileKind, string[]]> = [
  ["pdf", ["pdf"]],
  ["image", ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"]],
  ["video", ["mp4", "webm", "ogv", "mov"]],
  ["audio", ["mp3", "wav", "ogg", "m4a", "aac"]],
];

export function fileKindOf(mimeType = "", name = ""): FileKind {
  const mime = mimeType.toLowerCase();
  if (mime.includes("pdf")) return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";

  const extension = name.toLowerCase().split(".").pop() ?? "";
  const match = EXTENSION_KINDS.find(([, extensions]) => extensions.includes(extension));
  return match ? match[0] : "other";
}

const KIND_MIME: Record<Exclude<FileKind, "other">, string> = {
  pdf: "application/pdf",
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
};

export function blobForViewing(blob: Blob, kind: FileKind): Blob {
  if (kind === "pdf" && blob.type !== KIND_MIME.pdf) {
    return new Blob([blob], { type: KIND_MIME.pdf });
  }
  return blob;
}

export function fileNameFor(name: string, mimeType = ""): string {
  if (/\.[a-z0-9]{2,5}$/i.test(name)) return name;
  const subtype = mimeType.split("/")[1]?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9]{2,5}$/.test(subtype)) return name;
  return `${name}.${subtype === "jpeg" ? "jpg" : subtype}`;
}

export function fileKindLabel(kind: FileKind): string {
  return i18n.t(`fileKind.${kind}`);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
