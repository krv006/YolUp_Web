import { env } from "@/shared/config";

export const apiConfig = Object.freeze({
  baseUrl: env.apiUrl,
  timeoutMs: env.requestTimeout,
  defaultHeaders: Object.freeze({ Accept: "application/json" }) as Readonly<Record<string, string>>,
});

/**
 * Katta fayllarni Vercel proxy'sidan AYLANTIRIB, to'g'ridan-to'g'ri API domeniga yuborish uchun to'liq manzil.
 * Domen `VITE_WS_URL` dan olinadi (wss://host -> https://host); server CORS'da frontend domenini ruxsat etgan.
 * Nega: Vercel o'zi ham katta yuklashlarni proxy orqali emas, manbaga to'g'ridan-to'g'ri yuborishni tavsiya qiladi.
 */
export function directApiUrl(path: string): string {
  const origin = env.wsUrl.replace(/^ws/, "http");
  return origin ? `${origin}${path}` : path;
}
