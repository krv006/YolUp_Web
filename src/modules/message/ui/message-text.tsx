import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/ui/icon";
import { tokenizeMessageText, type MessageToken } from "../lib/linkify";

export interface MessageTextProps {
  text: string;
}

const RECORDING_PATH = /^\/recordings\//;

function isRecording(token: MessageToken): boolean {
  return token.kind === "internal" && RECORDING_PATH.test(token.href);
}

export function MessageText({ text }: MessageTextProps) {
  const { t } = useTranslation("chat");
  const tokens = useMemo(() => tokenizeMessageText(text), [text]);

  const recordings = tokens.filter(isRecording);
  const inline = tokens.filter((token) => !isRecording(token));
  const hasCopy = inline.some((token) => token.kind !== "text" || token.value.trim());

  return (
    <>
      {hasCopy ? (
        <p className="text-body break-words whitespace-pre-wrap">
          {inline.map((token, index) => {
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
      ) : null}

      {recordings.map((token, index) =>
        token.kind === "internal" ? (
          <Link
            key={`recording-${index}`}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-2.5 transition-colors hover:bg-subtle"
            to={token.href}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-action text-on-action">
              <Icon name="camera" size={19} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-label-strong text-ink">
                {t("text.viewRecording")}
              </strong>
              <small className="truncate text-caption text-ink-tertiary">
                {t("text.recordingHint")}
              </small>
            </span>
            <Icon name="chevron-right" size={18} className="shrink-0 text-ink-tertiary" />
          </Link>
        ) : null
      )}
    </>
  );
}
