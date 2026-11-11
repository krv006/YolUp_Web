import { AppError, API_ERROR_CODES } from "@/shared/api";
import { i18n } from "@/shared/i18n";
import {
  ASSIGNMENT_EXTENSIONS,
  HOMEWORK_EXTENSIONS,
  HOMEWORK_MAX_FILE_SIZE,
} from "../constants/homework.constants";

const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg"];

export interface ValidateHomeworkFileOptions {
  assignment?: boolean;
  speaking?: boolean;
}

export function validateHomeworkAnswer({
  files,
  comment,
  answers,
}: {
  files: readonly File[];
  comment?: string;
  answers?: readonly unknown[];
}): true {
  if (files.length || answers?.length || comment?.trim()) return true;
  throw new AppError({
    code: API_ERROR_CODES.VALIDATION_ERROR,
    message: i18n.t("homework:validation.fileOrComment"),
  });
}

export function validateHomeworkFile(
  file: File | null | undefined,
  { assignment = false, speaking = false }: ValidateHomeworkFileOptions = {}
): true {
  if (!file) {
    throw new AppError({
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message: i18n.t("homework:validation.chooseFile"),
      fields: { file: i18n.t("homework:validation.fileRequired") },
    });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowed: readonly string[] = assignment ? ASSIGNMENT_EXTENSIONS : HOMEWORK_EXTENSIONS;

  if (!allowed.includes(extension)) {
    throw new AppError({
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message: i18n.t("homework:validation.unsupportedType"),
      fields: { file: i18n.t("homework:validation.allowedTypes", { types: allowed.join(", ") }) },
    });
  }

  if (AUDIO_EXTENSIONS.includes(extension) && !speaking) {
    throw new AppError({
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message: i18n.t("homework:validation.audioOnlySpeaking"),
    });
  }

  if (file.size > HOMEWORK_MAX_FILE_SIZE) {
    throw new AppError({
      code: API_ERROR_CODES.FILE_TOO_LARGE,
      message: i18n.t("homework:validation.fileTooLarge"),
    });
  }

  return true;
}
