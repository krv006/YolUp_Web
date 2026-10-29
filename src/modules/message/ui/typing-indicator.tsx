import { useTranslation } from "react-i18next";

export function TypingIndicator({ name, kind = "text" }: { name: string; kind?: "text" | "voice" }) {
  const { t } = useTranslation("chat");
  return (
    <div
      className="flex items-center gap-2 text-caption text-ink-tertiary"
      aria-label={`${name} ${t(kind === "voice" ? "typing.voiceSuffix" : "typing.suffix")}`}
    >
      <span className="flex items-center gap-1 rounded-full bg-surface px-3 py-2 shadow-xs">
        {[0, 1, 2].map((dot) => (
          <i
            key={dot}
            className="size-1.5 animate-bounce rounded-full bg-ink-tertiary not-italic"
            style={{ animationDelay: `${dot * 0.12}s` }}
          />
        ))}
      </span>
      <small>
        {name.split(" ")[0]} {t(kind === "voice" ? "typing.voiceSuffix" : "typing.suffix")}
      </small>
    </div>
  );
}
