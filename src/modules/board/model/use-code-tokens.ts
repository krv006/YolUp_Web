import { useEffect, useMemo, useState } from "react";
import { loadHighlighter, plainLines, tokenizeCode, type CodeToken } from "../lib/code-highlight";

export function useCodeTokens(text: string, language: string | undefined): CodeToken[][] {
  const key = `${language ?? "auto"}\u0000${text}`;
  const [highlighted, setHighlighted] = useState<{ key: string; lines: CodeToken[][] } | null>(null);
  const plain = useMemo(() => plainLines(text), [text]);

  useEffect(() => {
    let active = true;
    void loadHighlighter().then((hljs) => {
      if (active) setHighlighted({ key, lines: tokenizeCode(hljs, text, language) });
    });
    return () => {
      active = false;
    };
  }, [key, text, language]);

  return highlighted?.key === key ? highlighted.lines : plain;
}
