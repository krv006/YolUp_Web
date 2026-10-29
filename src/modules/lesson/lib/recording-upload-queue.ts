/**
 * Dars yozuvi bo'laklarini yuklash uchun umumiy yordamchilar (video va audio yozuvchilar ikkalasi ishlatadi).
 *
 * 1) Saqlash (IndexedDB): yuklanmagan bo'lak brauzer xotirasidagina bo'lsa, internet uzilganda o'qituvchi sahifani
 *    yopsa/yangilasa yo'qolardi. Endi har bo'lak yuklanguncha IndexedDB da turadi; yangi sessiya ochilganda
 *    qolganlari avval yuklanadi. IndexedDB bo'lmasa (maxfiy rejim va h.k.) jim o'tkaziladi, avvalgidek ishlaydi.
 * 2) Tartib: bir dars va bir tur (video yoki audio) uchun yuklashlar KETMA-KET bajariladi. Aks holda yangi yozuv
 *    sessiyasining bo'laklari eskisining qolgan bo'laklaridan OLDIN serverga yetib borib, faylni buzardi.
 */

import { AppError } from "@/shared/api";

export type RecordingKind = "video" | "audio";

export interface StoredChunk {
  lessonId: string;
  kind: RecordingKind;
  session: string;
  index: number;
  blob: Blob;
  /** Faqat sessiyaning birinchi bo'lagida: yozuv brauzer soatida qachon boshlangan (server tanaffusni shu bilan to'ldiradi). */
  startedAt?: string;
  createdAt: number;
}

const DB_NAME = "fokus-recording-queue";
const STORE = "chunks";
/** Bundan eski qoldiqlar o'chiriladi (dars allaqachon tugagan). */
export const MAX_LEFTOVER_AGE_MS = 48 * 60 * 60 * 1000;

function keyOf(chunk: Pick<StoredChunk, "lessonId" | "kind" | "session" | "index">): string {
  return `${chunk.lessonId}|${chunk.kind}|${chunk.session}|${chunk.index}`;
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "key" });
          store.createIndex("lessonKind", ["lessonId", "kind"]);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

export const chunkStore = {
  async put(chunk: StoredChunk): Promise<void> {
    const db = await openDb();
    if (!db) return;
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ ...chunk, key: keyOf(chunk) });
      await done(tx);
    } catch {
      // joy yetmasa yoki xato bo'lsa — bo'lak xotirada qoladi (avvalgi xulq)
    } finally {
      db.close();
    }
  },

  async remove(chunk: Pick<StoredChunk, "lessonId" | "kind" | "session" | "index">): Promise<void> {
    const db = await openDb();
    if (!db) return;
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(keyOf(chunk));
      await done(tx);
    } catch {
      // e'tiborsiz
    } finally {
      db.close();
    }
  },

  /** Shu dars va tur uchun qolgan bo'laklar (eskisi oldin, ichida bo'lak raqami bo'yicha). `skipSessions` — hozir shu
   *  sahifada tirik sessiyalar: ular o'z bo'laklarini o'zi yuklaydi. Juda eskilar o'chiriladi. */
  async leftovers(lessonId: string, kind: RecordingKind, skipSessions: ReadonlySet<string>): Promise<StoredChunk[]> {
    const db = await openDb();
    if (!db) return [];
    try {
      const all = await new Promise<Array<StoredChunk & { key: string }>>((resolve) => {
        try {
          const request = db
            .transaction(STORE, "readonly")
            .objectStore(STORE)
            .index("lessonKind")
            .getAll([lessonId, kind]);
          request.onsuccess = () => resolve(request.result as Array<StoredChunk & { key: string }>);
          request.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });
      const cutoff = Date.now() - MAX_LEFTOVER_AGE_MS;
      const stale = all.filter((chunk) => chunk.createdAt < cutoff);
      if (stale.length) {
        const tx = db.transaction(STORE, "readwrite");
        stale.forEach((chunk) => tx.objectStore(STORE).delete(chunk.key));
        await done(tx);
      }
      return all
        .filter((chunk) => chunk.createdAt >= cutoff && !skipSessions.has(chunk.session))
        .sort((a, b) => a.createdAt - b.createdAt || a.index - b.index);
    } catch {
      return [];
    } finally {
      db.close();
    }
  },
};

const locks = new Map<string, Promise<unknown>>();

/** Bir xil `key` bo'yicha vazifalarni ketma-ket bajaradi (oldingisi xato bilan tugasa ham keyingisi ishlaydi). */
export function runExclusive<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  const tail = next.catch(() => undefined);
  locks.set(key, tail);
  void tail.then(() => {
    if (locks.get(key) === tail) locks.delete(key);
  });
  return next;
}

const MAX_RETRY_DELAY_MS = 30_000;

export function isRetryableUpload(error: unknown): boolean {
  if (!(error instanceof AppError)) return true;
  return error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

function waitUntilOnline(): Promise<void> {
  if (typeof navigator === "undefined" || navigator.onLine) return Promise.resolve();
  return new Promise((resolve) => {
    globalThis.addEventListener("online", () => resolve(), { once: true });
  });
}

/** Bitta bo'lakni yuboradi: vaqtinchalik xatoda (tarmoq, 408, 429, 5xx) internet qaytguncha va 1 s → 30 s kutib qayta
 *  uriniladi; qayta urinib bo'lmaydigan xatoda (masalan 403) xatoni tashlaydi. */
export async function uploadWithRetry(send: () => Promise<void>, onRetry?: (error: unknown) => void): Promise<void> {
  let attempt = 0;
  for (;;) {
    try {
      await send();
      return;
    } catch (error) {
      if (!isRetryableUpload(error)) throw error;
      onRetry?.(error);
      await waitUntilOnline();
      const delay = Math.min(1_000 * 2 ** attempt, MAX_RETRY_DELAY_MS);
      attempt += 1;
      await wait(delay);
    }
  }
}

export function newSessionId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return random ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
