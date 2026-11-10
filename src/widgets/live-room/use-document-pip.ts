import { useCallback, useEffect, useState } from "react";

interface DocumentPictureInPictureApi {
  window: Window | null;
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

function pipApi(): DocumentPictureInPictureApi | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { documentPictureInPicture?: DocumentPictureInPictureApi }).documentPictureInPicture ?? null;
}

export function isDocumentPipSupported(): boolean {
  return pipApi() !== null;
}

function mirrorDocument(target: Document, title: string) {
  const base = target.createElement("base");
  base.href = document.baseURI;
  target.head.appendChild(base);
  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.href) {
      const link = target.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href;
      target.head.appendChild(link);
      continue;
    }
    try {
      const style = target.createElement("style");
      style.textContent = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join("\n");
      target.head.appendChild(style);
    } catch {
      continue;
    }
  }
  const source = document.documentElement;
  target.documentElement.className = source.className;
  target.documentElement.lang = source.lang;
  target.documentElement.style.cssText = source.style.cssText;
  Object.entries(source.dataset).forEach(([key, value]) => {
    if (value !== undefined) target.documentElement.dataset[key] = value;
  });
  target.body.className = document.body.className;
  target.title = title;
}

export function useDocumentPip({ width, height, title }: { width: number; height: number; title: string }) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const supported = isDocumentPipSupported();

  const open = useCallback(async () => {
    const api = pipApi();
    if (!api) return;
    if (api.window) {
      api.window.focus();
      return;
    }
    const next = await api.requestWindow({ width, height });
    mirrorDocument(next.document, title);
    next.addEventListener("pagehide", () => setPipWindow(null), { once: true });
    setPipWindow(next);
  }, [width, height, title]);

  const close = useCallback(() => {
    pipApi()?.window?.close();
  }, []);

  useEffect(() => () => pipApi()?.window?.close(), []);

  return { supported, pipWindow, open, close };
}
