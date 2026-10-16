import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Paperclip, Pencil, Reply, SendHorizontal, Smile, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import type { ChatMessage, SendMessagePayload } from "@/shared/types";

export interface MessageComposerProps {
  onSend: (payload: SendMessagePayload) => void | Promise<void>;
  sending?: boolean;
  replyTo?: ChatMessage | null;
  editingMessage?: ChatMessage | null;
  onCancelContext: () => void;
  currentUserId?: string | null;
  onTyping?: () => void;
  allowAttachments?: boolean;
}

const emojis = ["🔥", "💎", "🚀", "👑", "⚡", "🎯"];

export function MessageComposer({
  onSend,
  sending,
  replyTo,
  editingMessage,
  onCancelContext,
  currentUserId = null,
  onTyping,
  allowAttachments = false,
}: MessageComposerProps) {
  const { t } = useTranslation("chat");
  const [draft, setDraft] = useState(() => editingMessage?.text ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  }, [draft]);

  useEffect(() => {
    if (editingMessage || replyTo) textareaRef.current?.focus();
  }, [editingMessage, replyTo]);

  async function submit() {
    const text = draft.trim();
    if ((!text && !selectedFile) || sending) return;
    const attachment = selectedFile
      ? {
          name: selectedFile.name,
          size: formatFileSize(selectedFile.size),
          mimeType: selectedFile.type,
          url: URL.createObjectURL(selectedFile),
        }
      : undefined;
    await onSend({ text, attachment });
    setDraft("");
    setSelectedFile(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape" && (replyTo || editingMessage)) {
      onCancelContext();
      if (editingMessage) setDraft("");
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  const context = editingMessage || replyTo;

  return (
    <div className="shrink-0 border-t border-line bg-surface px-4 py-4 lg:px-6">
      <AnimatePresence initial={false}>
        {context && (
          <motion.div
            className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-2"
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 5, height: 0 }}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-action-subtle text-action">
              {editingMessage ? <Pencil size={16} /> : <Reply size={17} />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-caption-strong text-ink">
                {editingMessage
                  ? t("composer.editingLabel")
                  : `${
                      replyTo?.senderName ||
                      (replyTo?.senderId === currentUserId
                        ? t("composer.youLabel")
                        : t("composer.replyFallback"))
                    }`}
              </strong>
              <small className="truncate text-caption text-ink-tertiary">{context.text}</small>
            </span>
            <button
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-subtle hover:text-ink"
              onClick={() => {
                onCancelContext();
                if (editingMessage) setDraft("");
              }}
              aria-label={
                editingMessage ? t("composer.cancelEditAria") : t("composer.cancelReplyAria")
              }
            >
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {selectedFile && (
          <motion.div
            className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-2"
            initial={{ opacity: 0, y: 6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 4, height: 0 }}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-action-subtle text-action">
              <Paperclip size={16} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-caption-strong text-ink">{selectedFile.name}</strong>
              <small className="text-caption text-ink-tertiary">
                {formatFileSize(selectedFile.size)}
              </small>
            </div>
            <button
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-subtle hover:text-ink"
              onClick={() => setSelectedFile(null)}
              aria-label={t("composer.removeAttachmentAria")}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mx-auto flex w-full max-w-[920px] items-end gap-3">
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 20 * 1024 * 1024) {
              toast.error(t("composer.fileTooLarge"));
              return;
            }
            setSelectedFile(file);
            toast.success(t("composer.fileAttached"));
            event.target.value = "";
          }}
        />
        {allowAttachments ? (
          <button
            className="grid size-12 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted disabled:opacity-50"
            onClick={() => fileRef.current?.click()}
            disabled={Boolean(editingMessage)}
            aria-label={t("composer.attachAria")}
          >
            <Paperclip size={20} />
          </button>
        ) : null}
        <div className="flex min-w-0 flex-1 items-end gap-2 rounded-3xl border border-line bg-canvas px-5 py-3">
          <textarea
            className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              editingMessage ? t("composer.editPlaceholder") : t("composer.sendPlaceholder")
            }
            aria-label={t("composer.textAria")}
          />
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                className="mb-0.5 grid size-7 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:text-ink"
                aria-label={t("composer.emojiAria")}
              >
                <Smile size={20} />
              </button>
            </DropdownTrigger>
            <DropdownContent className="emoji-picker">
              {emojis.map((emoji) => (
                <DropdownItem key={emoji} onSelect={() => setDraft((value) => value + emoji)}>
                  {emoji}
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>
        </div>
        <button
          className="grid size-12 shrink-0 place-items-center rounded-full bg-action text-on-action transition-colors hover:bg-action-hover disabled:opacity-40"
          onClick={submit}
          disabled={(!draft.trim() && !selectedFile) || sending}
          aria-label={editingMessage ? t("composer.saveEditAria") : t("composer.sendAria")}
        >
          {sending ? (
            <LoaderCircle className="spin" size={19} />
          ) : editingMessage ? (
            <Pencil size={18} />
          ) : (
            <SendHorizontal size={19} />
          )}
        </button>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
