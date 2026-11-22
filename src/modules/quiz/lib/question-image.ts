export const QUESTION_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
export const QUESTION_IMAGE_MAX_MB = 5;

/** Brauzer tomonida tez tekshiruv (server baribir qayta tekshiradi). */
export function checkQuestionImage(file: File): "imageBadType" | "imageTooLarge" | null {
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return "imageBadType";
  if (file.size > QUESTION_IMAGE_MAX_MB * 1024 * 1024) return "imageTooLarge";
  return null;
}

/** Buferdan (Ctrl+V) yoki sudrab tashlangan fayllardan birinchi rasmni oladi. */
export function pickImageFile(files: FileList | File[] | null | undefined): File | null {
  return Array.from(files ?? []).find((file) => file.type.startsWith("image/")) ?? null;
}
