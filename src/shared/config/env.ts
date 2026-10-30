import { z } from "@/shared/lib/zod";

const envSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).default("Fokus"),
  VITE_APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  VITE_API_URL: z
    .string()
    .trim()
    .refine((value) => value === "/" || URL.canParse(value), "VITE_API_URL to‘g‘ri URL yoki / bo‘lishi kerak"),
  VITE_WS_URL: z
    .string()
    .trim()
    .url("VITE_WS_URL to‘g‘ri WebSocket URL bo‘lishi kerak")
    .refine(
      (value) => value.startsWith("ws://") || value.startsWith("wss://"),
      "VITE_WS_URL ws:// yoki wss:// bilan boshlanishi kerak"
    ),
  VITE_REQUEST_TIMEOUT: z.coerce.number().int().min(1_000).max(120_000).default(15_000),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Environment konfiguratsiyasi noto‘g‘ri: ${details}`);
}

function normalizeBaseUrl(value: string): string {
  if (value === "/") return "";
  return value.replace(/\/+$/, "");
}

/**
 * API manzili. Production build'da `VITE_API_URL="/"` bo'lsa, so'rovlar Vercel proxy'si (`vercel.json` rewrite) orqali
 * o'tardi: o'lchandi (2026-10-29) — har so'rovga ~250-300 ms qo'shimcha (ba'zan 850 ms). Shuning uchun production'da API
 * to'g'ridan-to'g'ri chaqiriladi: manzil `VITE_WS_URL` domenidan olinadi (wss://host -> https://host), WebSocket va katta
 * fayllar uchun (`directApiUrl`) allaqachon shunday. Server CORS'da Vercel domenlarini ruxsat etgan.
 * Eski usulga qaytish kerak bo'lsa: `VITE_API_PROXY=1`. Dev rejimda o'zgarmaydi (Vite proxy).
 */
function resolveApiUrl(apiUrl: string, wsUrl: string): string {
  const base = normalizeBaseUrl(apiUrl);
  if (base !== "" || !import.meta.env.PROD || import.meta.env.VITE_API_PROXY === "1") return base;
  return normalizeBaseUrl(wsUrl).replace(/^ws/, "http");
}

export interface AppEnv {
  readonly appName: string;
  readonly appEnv: "development" | "test" | "production";
  readonly apiUrl: string;
  readonly wsUrl: string;
  readonly requestTimeout: number;
  readonly isProduction: boolean;
}

export const env: AppEnv = Object.freeze({
  appName: parsedEnv.data.VITE_APP_NAME,
  appEnv: parsedEnv.data.VITE_APP_ENV,
  apiUrl: resolveApiUrl(parsedEnv.data.VITE_API_URL, parsedEnv.data.VITE_WS_URL),
  wsUrl: normalizeBaseUrl(parsedEnv.data.VITE_WS_URL),
  requestTimeout: parsedEnv.data.VITE_REQUEST_TIMEOUT,
  isProduction: parsedEnv.data.VITE_APP_ENV === "production",
});
