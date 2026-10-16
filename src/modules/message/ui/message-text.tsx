import { useMemo } from "react";
import { PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { tokenizeMessageText } from "../lib/linkify";

export interface MessageTextProps {
  text: string;
}

const RECORDING_PATH = /^\/recordings\//;

export function MessageText({ text }: MessageTextProps) {
  const { t } = useTranslation("chat");
  const tokens = useMemo(() => tokenizeMessageText(text), [text]);

  return (
    <p className="text-body break-words whitespace-pre-wrap">
      {tokens.map((token, index) => {
        if (token.kind === "internal" && RECORDING_PATH.test(token.href)) {
          return (
            <Link
              key={index}
              className="mx-0.5 inline-flex items-center gap-1 rounded-full bg-action-subtle px-2 py-0.5 text-caption-strong text-action"
              to={token.href}
              onClick={(event) => event.stopPropagation()}
            >
              <PlayCircle size={15} /> {t("text.viewRecording")}
            </Link>
          );
        }
        if (token.kind === "internal") {
          return (
            <Link
              key={index}
              className="underline underline-offset-2"
              to={token.href}
              onClick={(event) => event.stopPropagation()}
            >
              {token.value}
            </Link>
          );
        }
        if (token.kind === "external") {
          return (
            <a
              key={index}
              className="underline underline-offset-2"
              href={token.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              {token.value}
            </a>
          );
        }
        return <span key={index}>{token.value}</span>;
      })}
    </p>
  );
}
