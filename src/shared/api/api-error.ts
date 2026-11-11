export const API_ERROR_CODES = Object.freeze({
  NETWORK_ERROR: "NETWORK_ERROR",
  OFFLINE: "OFFLINE",
  TIMEOUT: "TIMEOUT",
  REQUEST_ABORTED: "REQUEST_ABORTED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
});

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export type ApiFieldErrors = Record<string, string | string[]>;

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: API_ERROR_CODES.VALIDATION_ERROR,
  401: API_ERROR_CODES.UNAUTHORIZED,
  403: API_ERROR_CODES.FORBIDDEN,
  404: API_ERROR_CODES.NOT_FOUND,
  409: API_ERROR_CODES.CONFLICT,
  413: API_ERROR_CODES.FILE_TOO_LARGE,
  422: API_ERROR_CODES.VALIDATION_ERROR,
  429: API_ERROR_CODES.RATE_LIMITED,
};

export interface AppErrorInit {
  code?: string;
  message?: string;
  status?: number;
  fields?: ApiFieldErrors | null;
  retryAfter?: number | null;
  detail?: string | null;
  details?: unknown;
  requestId?: string | null;
  originalError?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields: ApiFieldErrors | null;
  readonly retryAfter: number | null;
  readonly detail: string | null;
  readonly details: unknown;
  readonly requestId: string | null;
  readonly originalError: unknown;

  constructor({
    code = API_ERROR_CODES.UNKNOWN_ERROR,
    message = "So‘rovni bajarib bo‘lmadi",
    status = 0,
    fields = null,
    retryAfter = null,
    detail = null,
    details = null,
    requestId = null,
    originalError = null,
  }: AppErrorInit) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.fields = fields;
    this.retryAfter = retryAfter;
    this.detail = detail;
    this.details = details;
    this.requestId = requestId;
    this.originalError = originalError;
  }
}

export const ApiError = AppError;
export type ApiError = AppError;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function extractFields(details: unknown): ApiFieldErrors | null {
  const record = asRecord(details);
  if (!record) return null;
  const source = asRecord(record.fields) ?? record;
  const fields = Object.fromEntries(
    Object.entries(source).filter(
      ([key, value]) => key !== "detail" && (typeof value === "string" || Array.isArray(value))
    )
  ) as ApiFieldErrors;
  return Object.keys(fields).length > 0 ? fields : null;
}

export interface CreateApiErrorInit {
  payload: unknown;
  status?: number;
  requestId?: string | null;
  originalError?: unknown;
}

export function createApiError({
  payload,
  status = 0,
  requestId = null,
  originalError = null,
}: CreateApiErrorInit): AppError {
  const body = asRecord(payload);
  const backendError = asRecord(body?.error);
  const details = backendError?.details ?? body?.details ?? null;
  const code =
    asString(backendError?.code) ??
    STATUS_CODES[status] ??
    (status >= 500 ? API_ERROR_CODES.SERVER_ERROR : API_ERROR_CODES.UNKNOWN_ERROR);

  return new AppError({
    code,
    status,
    requestId,
    fields: (backendError?.fields as ApiFieldErrors | undefined) ?? extractFields(details),
    retryAfter: typeof backendError?.retry_after === "number" ? backendError.retry_after : null,
    detail: asString(asRecord(details)?.detail) ?? asString(body?.detail) ?? null,
    details,
    message:
      asString(backendError?.message) ??
      asString(body?.message) ??
      asString(body?.detail) ??
      defaultMessage(status),
    originalError,
  });
}

export interface TransportErrorFlags {
  aborted?: boolean;
  timedOut?: boolean;
  offline?: boolean;
}

export function createTransportError(
  error: unknown,
  { aborted = false, timedOut = false, offline = false }: TransportErrorFlags = {}
): AppError {
  if (timedOut)
    return new AppError({
      code: API_ERROR_CODES.TIMEOUT,
      message: "So‘rov vaqti tugadi. Qayta urinib ko‘ring.",
      originalError: error,
    });
  if (aborted)
    return new AppError({
      code: API_ERROR_CODES.REQUEST_ABORTED,
      message: "So‘rov bekor qilindi",
      originalError: error,
    });
  if (offline)
    return new AppError({
      code: API_ERROR_CODES.OFFLINE,
      message: "Internet aloqasi mavjud emas",
      originalError: error,
    });
  return new AppError({
    code: API_ERROR_CODES.NETWORK_ERROR,
    message: "Server bilan bog‘lanib bo‘lmadi",
    originalError: error,
  });
}

function defaultMessage(status: number): string {
  if (status === 401) return "Sessiya tugagan. Qayta kiring.";
  if (status === 403) return "Bu amal uchun ruxsat yetarli emas.";
  if (status === 404) return "So‘ralgan ma’lumot topilmadi.";
  if (status === 429) return "Juda ko‘p so‘rov yuborildi. Biroz kuting.";
  if (status >= 500) return "Serverda xatolik yuz berdi.";
  return "So‘rovni bajarib bo‘lmadi";
}
