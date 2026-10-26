import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BoardSource, BoardState, StrokeDto, StrokeInput } from "@/modules/board";
import { useSaveHomeworkBoard } from "./homework.queries";

const AUTOSAVE_MS = 1500;

export type HomeworkBoardSaveState = "saved" | "saving" | "error";

export interface HomeworkBoardInit {
  sheets: StrokeDto[][];
  width: number;
  height: number;
}

function newId(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

/**
 * Uy vazifasi doskasi uchun ma'lumot manbai: `BoardPanel` (dars doskasining o'zi) shu manbadan ishlaydi.
 * Holat shu yerda saqlanadi, o'zgarishlar avtomatik serverga yoziladi (debounce), chiqishda oxirgi holat yuboriladi.
 */
export function useHomeworkBoardSource(assignmentId: string, init: HomeworkBoardInit) {
  const [sheets, setSheetsState] = useState<StrokeDto[][]>(() => (init.sheets.length ? init.sheets : [[]]));
  const sheetsRef = useRef(sheets);
  const [saveState, setSaveState] = useState<HomeworkBoardSaveState>("saved");
  const save = useSaveHomeworkBoard(assignmentId);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);

  const flushRef = useRef<() => Promise<boolean>>(() => Promise.resolve(true));

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current) return true;
    if (saving.current) return false;
    saving.current = true;
    try {
      while (dirty.current) {
        dirty.current = false;
        setSaveState("saving");
        await save.mutateAsync(sheetsRef.current); // saqlash paytida yana o'zgargan bo'lsa, sikl yana yozadi
      }
      setSaveState("saved");
      return true;
    } catch {
      dirty.current = true;
      setSaveState("error");
      timer.current = setTimeout(() => void flushRef.current(), 5000); // xato bo'lsa qayta uriniladi
      return false;
    } finally {
      saving.current = false;
    }
  }, [save]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  function change(next: StrokeDto[][]) {
    sheetsRef.current = next;
    setSheetsState(next);
    dirty.current = true;
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
  }

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      void flush(); // sahifadan chiqqanda oxirgi o'zgarishlar yo'qolmasin
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const state: BoardState = useMemo(
    () => ({
      sheets: sheets.map((strokes, index) => ({ index, title: "", strokes })),
      canDraw: true,
      isTeacher: false,
      width: init.width,
      height: init.height,
      subject: "",
      permissionMode: "everyone" as const,
      // Doska fanga bog'lanmagan: hamma fanda bir xil umumiy asboblar (yechuvchi/davriy jadval yo'q)
      mathEnabled: false,
      chemistryEnabled: false,
      awayStudents: [],
      pendingMicRequests: [],
      pendingCameraRequests: [],
    }),
    [sheets, init.width, init.height]
  );

  const source: BoardSource = {
    state,
    addStroke: (sheet, stroke) => addStrokes(sheet, [stroke]),
    addStrokes,
    addSheet: () => change([...sheetsRef.current, []]),
    eraseStroke: (sheet, strokeId) =>
      change(sheetsRef.current.map((items, index) => (index === sheet ? items.filter((item) => item.id !== strokeId) : items))),
  };

  function addStrokes(sheet: number, strokes: StrokeInput[]) {
    const added = strokes.map((stroke) => ({ ...stroke, id: newId() }) as StrokeDto);
    change(sheetsRef.current.map((items, index) => (index === sheet ? [...items, ...added] : items)));
  }

  return { source, saveState, flush };
}
