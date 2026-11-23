import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface PopupPosition {
  top: number;
  left: number;
}

/** Muharrir ustidagi suzuvchi oyna: ekranga nisbatan joylashadi, tashqariga bosilsa yoki Esc bosilsa yopiladi. */
export function Popup({
  position,
  onClose,
  children,
  className = "",
  closeOnOutside = true,
}: {
  position: PopupPosition;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  closeOnOutside?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onClose || !closeOnOutside) return;
    const down = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", down, true);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down, true);
      document.removeEventListener("keydown", key);
    };
  }, [onClose, closeOnOutside]);

  const left = Math.max(8, Math.min(position.left, window.innerWidth - 340));
  return createPortal(
    <div
      ref={ref}
      // Tugmalarga bosilganda muharrirdagi belgilash yo'qolmasligi uchun
      onMouseDown={(event) => event.preventDefault()}
      style={{ position: "fixed", top: position.top, left, zIndex: 60 }}
      className={`rounded-xl border border-line bg-surface shadow-lg ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}
