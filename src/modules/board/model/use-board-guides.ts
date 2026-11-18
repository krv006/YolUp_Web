import { useCallback, useState } from "react";
import { storage } from "@/shared/lib";

export const BOARD_GUIDES_KEY = "fokus_board_guides";

export function useBoardGuides() {
  const [guides, setGuides] = useState(() => storage.get(BOARD_GUIDES_KEY) === "1");
  const toggleGuides = useCallback(() => {
    setGuides((current) => {
      const next = !current;
      storage.set(BOARD_GUIDES_KEY, next ? "1" : "0");
      return next;
    });
  }, []);
  return { guides, toggleGuides };
}
