import { getStoredLanguage } from "@/shared/model";
import { tokenStorage } from "./token-storage";
import type { ResponseType } from "./api-response";

export type QueryValue = string | number | boolean | null | undefined | Array<string | number>;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: QueryParams;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  timeoutMs?: number;
  responseType?: ResponseType;
  requestId?: string;
  skipAuth?: boolean;
  skipRefresh?: boolean;
  onUploadProgress?: (fraction: number) => void;
}

export function appendQuery(url: string, query?: QueryParams): string {
  if (!query) return url;
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) value.forEach((item) => search.append(key, String(item)));
    else search.set(key, String(value));
  });
  const queryString = search.toString();
  return queryString ? `${url}${url.includes("?") ? "&" : "?"}${queryString}` : url;
}

export function buildRequestUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const absolute = /^https?:\/\//.test(path);
  const normalizedPath = absolute ? path : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  return appendQuery(normalizedPath, query);
}

export function createRequestInit(
  options: RequestOptions,
  signal: AbortSignal,
  defaultHeaders: Readonly<Record<string, string>>
): RequestInit {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const hasBody = options.body !== undefined && options.body !== null;
  const token = options.skipAuth ? null : tokenStorage.getAccessToken();
  const isRawBody = isFormData || typeof options.body === "string" || options.body instanceof Blob;

  return {
    method: options.method ?? (hasBody ? "POST" : "GET"),
    body: hasBody
      ? isRawBody
        ? (options.body as BodyInit)
        : JSON.stringify(options.body)
      : undefined,
    credentials: options.credentials ?? "omit",
    headers: {
      ...defaultHeaders,
      "Accept-Language": getStoredLanguage(),
      ...(hasBody && !isRawBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.requestId ? { "X-Request-ID": options.requestId } : {}),
      ...options.headers,
    },
    signal,
  };
}
