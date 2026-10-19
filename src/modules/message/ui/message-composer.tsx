import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, LoaderCircle, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCourseStudents } from "@/modules/course";
import { useOnlineStatus } from "@/shared/model";
import { Avatar, Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
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
  courseId?: string | null;
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
  courseId = null,
}: MessageComposerProps) {
  const { t } = useTranslation("chat");
  const [draft, setDraft] = useState(() => editingMessage?.text ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [activeMention, setActiveMention] = useState(0);
  const online = useOnlineStatus();
  const members = useCourseStudents(courseId, { page_size: 100 }, Boolean(courseId) && Boolean(mention));

  const suggestions = (() => {
    if (!mention) return [];
    const query = mention.query.toLowerCase();
    return (members.data?.items ?? [])
      .map((item) => item.student)
      .filter((student) =>
        query ? `${student.name} ${student.username}`.toLowerCase().includes(query) : true
      )
      .slice(0, 6);
  })();

  function detectMention(value: string, caret: number) {
    const before = value.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at === -1) {
      setMention(null);
      return;
    }
    const previous = at === 0 ? " " : before[at - 1];
    const query = before.slice(at + 1);
    if (!/\s/.test(previous) || /\s/.test(query)) {
      setMention(null);
      return;
    }
    setActiveMention(0);
    setMention({ query, start: at });
  }

  function applyMention(username: string) {
    if (!mention) return;
    const element = textareaRef.current;
    const caret = element?.selectionStart ?? draft.length;
    const next = `${draft.slice(0, mention.start)}@${username} ${draft.slice(caret)}`;
    setDraft(next);
    setMention(null);
    requestAnimationFrame(() => {
      const position = mention.start + username.length + 2;
      element?.focus();
      element?.setSelectionRange(position, position);
    });
  }

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
    if (mention && suggestions.length) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveMention((index) => (index + 1) % suggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveMention((index) => (index - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        applyMention(suggestions[activeMention].username);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMention(null);
        return;
      }
    }
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
    <div className="relative shrink-0 border-t border-line bg-surface px-4 py-4 lg:px-6">
      {online ? null : (
        <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-saffron-subtle px-3 py-2 text-saffron-strong">
          <Icon name="error" size={16} className="shrink-0" />
          <span className="text-caption">{t("offline.composer")}</span>
        </div>
      )}

      <AnimatePresence>
        {mention ? (
          <motion.div
            className="absolute bottom-full left-4 z-30 mb-2 flex w-[280px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl lg:left-6"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            <span className="px-4 pt-3 pb-2 text-caption-strong text-ink-tertiary">
              {t("mention.title")}
            </span>
            {suggestions.length ? (
              suggestions.map((student, index) => (
                <button
                  key={student.id}
                  type="button"
                  className={`flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    index === activeMention ? "bg-subtle" : "hover:bg-subtle"
                  }`}
                  onMouseEnter={() => setActiveMention(index)}
                  onClick={() => applyMention(student.username)}
                >
                  <Avatar name={student.name} tone={student.avatarTone} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-label-strong text-ink">{student.name}</strong>
                    <small className="truncate text-caption text-ink-tertiary">
                      @{student.username}
                    </small>
                  </span>
                </button>
              ))
            ) : (
              <span className="px-4 pb-3 text-caption text-ink-tertiary">
                {members.isLoading ? "..." : t("mention.empty")}
              </span>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {context && (
          <motion.div
            className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-2"
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 5, height: 0 }}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-action-subtle text-action">
              {editingMessage ? <Icon name="edit" size={16} /> : <Icon name="arrow-back" size={17} />}
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
              <Icon name="add" size={18} className="rotate-45" />
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
              <Icon name="assign" size={16} />
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
              <Icon name="add" size={17} className="rotate-45" />
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
        <button
          className="grid size-12 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => fileRef.current?.click()}
          disabled={!allowAttachments || Boolean(editingMessage)}
          title={allowAttachments ? undefined : t("composer.attachUnavailable")}
          aria-label={t("composer.attachAria")}
        >
          <Icon name="add" size={22} />
        </button>
        <div className="flex min-w-0 flex-1 items-end gap-2 rounded-3xl border border-line bg-canvas px-5 py-3">
          <textarea
            className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              detectMention(event.target.value, event.target.selectionStart ?? 0);
              onTyping?.();
            }}
            onClick={(event) =>
              detectMention(event.currentTarget.value, event.currentTarget.selectionStart ?? 0)
            }
            onKeyDown={handleKeyDown}
            placeholder={
              editingMessage ? t("composer.editPlaceholder") : t("composer.sendPlaceholder")
            }
            aria-label={t("composer.textAria")}
          />
          <button
            type="button"
            className="mb-0.5 grid size-7 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:text-ink"
            onClick={() => {
              const next = draft.endsWith("@") ? draft : `${draft}${draft && !draft.endsWith(" ") ? " " : ""}@`;
              setDraft(next);
              textareaRef.current?.focus();
              detectMention(next, next.length);
            }}
            aria-label={t("actionsMenu.mentionAria")}
          >
            <AtSign size={18} />
          </button>
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                className="mb-0.5 grid size-7 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:text-ink"
                aria-label={t("composer.emojiAria")}
              >
                <Icon name="emoji" size={20} />
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
          type="button"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted"
          onClick={() => toast.info(t("composer.voiceUnavailable"))}
          aria-label={t("actionsMenu.voiceAria")}
        >
          <Mic size={20} />
        </button>
        <button
          className="grid size-12 shrink-0 place-items-center rounded-full bg-action text-on-action transition-colors hover:bg-action-hover disabled:opacity-40"
          onClick={submit}
          disabled={(!draft.trim() && !selectedFile) || sending}
          aria-label={editingMessage ? t("composer.saveEditAria") : t("composer.sendAria")}
        >
          {sending ? (
            <LoaderCircle className="animate-spin" size={19} />
          ) : editingMessage ? (
            <Icon name="edit" size={18} />
          ) : (
            <Icon name="send" size={20} />
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
