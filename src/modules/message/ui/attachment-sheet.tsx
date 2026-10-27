import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ChatMessage } from "@/shared/types";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { messageApi } from "../api/message.api";
import { messageKeys } from "../model/message.keys";

const DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,application/pdf";
const RECENT_LIMIT = 3;

export interface AttachmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (files: FileList | null) => void;
  onAssignment?: () => void;
  maxSizeMb: number;
  roomId?: string;
}

export function AttachmentSheet({
  open,
  onOpenChange,
  onPick,
  onAssignment,
  maxSizeMb,
  roomId,
}: AttachmentSheetProps) {
  const { t } = useTranslation("chat");
  const client = useQueryClient();
  const isCompact = useIsCompact();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const recent = roomId
    ? (client.getQueryData<ChatMessage[]>(messageKeys.all(roomId)) ?? [])
        .filter((message) => message.attachment?.kind === "image" && message.attachment.url)
        .slice(-RECENT_LIMIT)
        .reverse()
    : [];

  function handleTile(id: string) {
    if (id === "gallery") galleryRef.current?.click();
    if (id === "camera") cameraRef.current?.click();
    if (id === "document") documentRef.current?.click();
    if (id === "assignment") {
      onOpenChange(false);
      onAssignment?.();
    }
  }

  const tiles = [
    { id: "gallery", label: t("attach.gallery"), icon: "folder", tone: "bg-brand-subtle text-brand" },
    {
      id: "camera",
      label: t("attach.camera"),
      icon: "photo-camera-fill",
      tone: "bg-accent-green-bg text-success",
    },
    {
      id: "document",
      label: t("attach.document"),
      icon: "assignment-check-fill",
      tone: "bg-accent-saffron-bg text-accent-saffron-fg",
    },
    ...(onAssignment
      ? [
          {
            id: "assignment",
            label: t("attach.assignment"),
            icon: "assign",
            tone: "bg-accent-violet-bg text-accent-violet-fg",
          },
        ]
      : []),
  ];

  function pick(files: FileList | null) {
    onOpenChange(false);
    onPick(files);
  }

  async function pickRecent(message: ChatMessage) {
    const attachment = message.attachment;
    if (!attachment) return;
    setLoadingId(message.id);
    try {
      const blob = (await messageApi.downloadFile(message.id, {})) as Blob;
      const transfer = new DataTransfer();
      transfer.items.add(
        new File([blob], attachment.name || "image.jpg", {
          type: attachment.mimeType || blob.type || "image/jpeg",
        })
      );
      pick(transfer.files);
    } catch {
      toast.error(t("attach.recentFailed"));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      width="lg:w-120"
      title={t("attach.title")}
      description={t("attach.sizeHint", { size: maxSizeMb })}
      titleClassName={isCompact ? "text-h2 leading-6 font-semibold" : undefined}
      closeClassName={isCompact ? "size-11" : undefined}
    >
      <div className="max-lg:-mt-0.5 max-lg:pb-7.5">
        {isCompact ? (
          <div className="mb-4 flex justify-between">
            <button
              type="button"
              className="grid size-20 shrink-0 place-items-center rounded-xl bg-subtle text-ink-secondary"
              onClick={() => handleTile("camera")}
              aria-label={t("attach.camera")}
            >
              <Icon name="photo-camera-fill" size={24} />
            </button>
            {recent.map((message) => (
              <button
                key={message.id}
                type="button"
                className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-subtle disabled:opacity-60"
                disabled={loadingId !== null}
                onClick={() => void pickRecent(message)}
              >
                <img
                  src={message.attachment?.url ?? ""}
                  alt={message.attachment?.name ?? ""}
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-3 pb-2 max-lg:pb-0">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className="flex flex-col items-center gap-2 max-lg:gap-1.5"
              onClick={() => handleTile(tile.id)}
            >
              <span
                className={`grid size-12 place-items-center rounded-xl max-lg:size-10 max-lg:rounded-[10px] ${tile.tone}`}
              >
                <Icon name={tile.icon} size={22} />
              </span>
              <small className="text-body-xs text-ink-secondary max-lg:text-body-sm max-lg:text-ink">
                {tile.label}
              </small>
            </button>
          ))}
        </div>

        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            pick(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(event) => {
            pick(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={documentRef}
          type="file"
          accept={DOCUMENT_TYPES}
          multiple
          hidden
          onChange={(event) => {
            pick(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
    </AppDialog>
  );
}
