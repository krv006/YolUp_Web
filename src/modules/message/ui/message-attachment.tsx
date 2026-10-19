import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { fileKindLabel, fileKindOf } from "@/shared/lib";
import type { MessageAttachment as Attachment } from "@/shared/types";
import { FileViewer } from "@/shared/ui/file-viewer";
import { Icon } from "@/shared/ui/icon";
import { messageApi } from "../api/message.api";

export function MessageAttachment({
  attachment,
  failed = false,
}: {
  attachment: Attachment;
  failed?: boolean;
}) {
  const { t } = useTranslation("chat");
  const [open, setOpen] = useState(false);
  const kind = fileKindOf(attachment.mimeType, attachment.name);
  const extension = attachment.name.split(".").pop()?.slice(0, 4).toUpperCase() ?? "FILE";

  const load = useCallback(
    (signal: AbortSignal) => messageApi.downloadFile(attachment.messageId, { signal }),
    [attachment.messageId]
  );

  return (
    <>
      <button
        type="button"
        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
          failed ? "border-error-bg bg-error-bg/50" : "border-line bg-surface hover:bg-subtle"
        }`}
        onClick={() => setOpen(true)}
        disabled={failed}
        aria-label={t("attachment.openAria", { name: attachment.name })}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-error-bg text-caption-strong text-error-text">
          {failed ? <Icon name="error" size={20} /> : extension}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-label-strong text-ink">{attachment.name}</strong>
          <small
            className={`truncate text-caption ${failed ? "text-error-text" : "text-ink-tertiary"}`}
          >
            {failed
              ? `${t("attachment.uploadFailed")} · ${fileKindLabel(kind)}`
              : `${fileKindLabel(kind)} · ${t("attachment.openSuffix")}`}
          </small>
        </span>
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-full ${
            failed ? "text-error-text" : "bg-subtle text-ink-secondary"
          }`}
        >
          <Icon name={failed ? "refresh" : "download"} size={16} />
        </span>
      </button>

      <FileViewer
        open={open}
        onOpenChange={setOpen}
        name={attachment.name}
        mimeType={attachment.mimeType}
        load={load}
      />
    </>
  );
}
