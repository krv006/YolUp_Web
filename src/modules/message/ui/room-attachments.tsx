import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { RoomAttachment } from "@/shared/types";
import { FileViewer } from "@/shared/ui/file-viewer";
import { Icon } from "@/shared/ui/icon";
import { messageApi } from "../api/message.api";
import { MessageAttachment } from "./message-attachment";

export interface RoomAttachmentsProps {
  roomId: string;
  type: "file" | "media";
  empty?: ReactNode;
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

export function RoomAttachments({ roomId, type, empty }: RoomAttachmentsProps) {
  const { t } = useTranslation("chat");
  const query = useQuery({
    queryKey: ["conversations", roomId, "attachments", type],
    queryFn: ({ signal }) => messageApi.getAttachments(roomId, type, { signal }),
    staleTime: 30_000,
  });
  const items = query.data ?? [];

  if (query.isLoading)
    return (
      <div className={type === "media" ? "grid grid-cols-3 gap-2" : "flex flex-col gap-2"} aria-hidden="true">
        {Array.from({ length: type === "media" ? 6 : 3 }, (_, index) => (
          <i key={index} className={`rounded-xl bg-skeleton ${type === "media" ? "aspect-square" : "h-16"}`} />
        ))}
      </div>
    );

  if (!items.length)
    return empty ?? (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface px-6 py-10 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-subtle text-ink-tertiary">
          <Icon name={type === "file" ? "assign" : "camera"} size={22} />
        </span>
        <strong className="text-label-strong text-ink">{type === "file" ? t("info.filesEmpty") : t("info.mediaEmpty")}</strong>
        <small className="text-caption text-ink-tertiary">
          {type === "file" ? t("info.filesEmptyHint") : t("info.mediaEmptyHint")}
        </small>
      </div>
    );

  if (type === "media")
    return (
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <MediaTile key={item.messageId} item={item} />
        ))}
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.messageId} className="flex flex-col gap-1">
          <MessageAttachment attachment={item} />
          <small className="truncate px-1 text-caption text-ink-tertiary">
            {[item.senderName, shortDate(item.createdAt)].filter(Boolean).join(" · ")}
          </small>
        </div>
      ))}
    </div>
  );
}

function MediaTile({ item }: { item: RoomAttachment }) {
  const { t } = useTranslation("chat");
  const [open, setOpen] = useState(false);
  const preview = item.thumbnailUrl ?? item.url;
  return (
    <>
      <button
        type="button"
        className="relative aspect-square overflow-hidden rounded-xl bg-subtle"
        onClick={() => setOpen(true)}
        aria-label={t("attachment.openAria", { name: item.name })}
      >
        {preview ? (
          <img className="size-full object-cover" src={preview} alt={item.name} loading="lazy" draggable={false} />
        ) : (
          <Icon name={item.mimeType.startsWith("video") ? "videocam" : "image"} size={24} className="m-auto text-ink-tertiary" />
        )}
        {item.mimeType.startsWith("video") ? (
          <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
            <Icon name="play-circle-fill" size={28} />
          </span>
        ) : null}
      </button>
      <FileViewer
        open={open}
        onOpenChange={setOpen}
        name={item.name}
        mimeType={item.mimeType}
        meta={[item.senderName, shortDate(item.createdAt)].filter(Boolean).join(" · ")}
        load={(signal) => messageApi.downloadFile(item.messageId, { signal })}
      />
    </>
  );
}
