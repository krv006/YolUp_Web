import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, LoaderCircle, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { useQuery } from "@tanstack/react-query";
import { useOnlineStatus } from "@/shared/model";
import { messageApi } from "../api/message.api";
import { messageKeys } from "../model/message.keys";
import { Avatar, Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { AttachmentSheet } from "./attachment-sheet";
import { ImagePreviewScreen } from "./image-preview-screen";
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
  roomId?: string | null;
  /** Mobil biriktirish panelidagi "Vazifa" tugmasi (faqat o'qituvchi guruhida). */
  onAssignment?: () => void;
}

const emojis = ["🔥", "💎", "🚀", "👑", "⚡", "🎯"];

const WAVE = Array.from({ length: 34 }, (_, index) => 6 + ((index * 7) % 17));

export function MessageComposer({
  onSend,
  sending,
  replyTo,
  editingMessage,
  onCancelContext,
  currentUserId = null,
  onTyping,
  allowAttachments = true,
  roomId = null,
  onAssignment,
}: MessageComposerProps) {
  const { t } = useTranslation("chat");
  const [draft, setDraft] = useState(() => editingMessage?.text ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const secondsRef = useRef(0);
  const chunksRef = useRef<Blob[]>([]);
  const cancelRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [activeMention, setActiveMention] = useState(0);
  const online = useOnlineStatus();
  const members = useQuery({
    queryKey: messageKeys.members(roomId ?? "", mention?.query ?? ""),
    queryFn: ({ signal }) =>
      messageApi.getMembers(roomId as string, mention?.query ?? "", { signal }),
    enabled: Boolean(roomId) && Boolean(mention),
  });

  const suggestions = (members.data ?? []).slice(0, 6);
  const [mentioned, setMentioned] = useState<Record<string, string>>({});

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

  function applyMention(username: string, userId?: string) {
    if (!mention) return;
    if (userId) setMentioned((current) => ({ ...current, [username]: userId }));
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

  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(
      () =>
        setSeconds((value) => {
          secondsRef.current = value + 1;
          return value + 1;
        }),
      1000
    );
    return () => window.clearInterval(timer);
  }, [recording]);

  function activeMentions(text: string): string[] {
    return Object.entries(mentioned)
      .filter(([username]) => text.includes(`@${username}`))
      .map(([, id]) => id);
  }

  async function submit() {
    const text = draft.trim();
    if ((!text && !files.length) || sending) return;
    const mentions = activeMentions(text);
    if (!files.length) {
      await onSend({ text, mentions, clientMessageId: crypto.randomUUID() });
    } else {
      for (const [index, file] of files.entries()) {
        await onSend({
          text: index === 0 ? text : "",
          file,
          mentions: index === 0 ? mentions : [],
          clientMessageId: crypto.randomUUID(),
        });
      }
    }
    setDraft("");
    setFiles([]);
  }

  const isCompact = useIsCompact();
  const [attachOpen, setAttachOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const accepted: File[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(t("composer.fileTooLarge"));
        continue;
      }
      accepted.push(file);
    }
    if (!accepted.length) return;
    setFiles((current) => [...current, ...accepted]);
    if (isCompact && accepted.every((file) => file.type.startsWith("image/"))) {
      setPreviewOpen(true);
      return;
    }
    toast.success(t("composer.fileAttached"));
  }

  async function startRecording() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      cancelRef.current = false;
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (cancelRef.current) return;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (!blob.size) return;
        const extension = (recorder.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        void onSend({
          text: "",
          clientMessageId: crypto.randomUUID(),
          voice: {
            file: new File([blob], `voice-${Date.now()}.${extension}`, { type: blob.type }),
            durationMs: Math.max(1000, secondsRef.current * 1000),
          },
        });
      };
      recorderRef.current = recorder;
      recorder.start();
      secondsRef.current = 0;
      setSeconds(0);
      setRecording(true);
    } catch {
      toast.error(t("composer.micDenied"));
    }
  }

  function stopRecording(cancel: boolean) {
    cancelRef.current = cancel;
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    setSeconds(0);
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
        applyMention(suggestions[activeMention].username, suggestions[activeMention].id);
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
  const hasContent = Boolean(draft.trim() || files.length);

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
                  onClick={() => applyMention(student.username, student.id)}
                >
                  <Avatar name={student.name} src={student.avatarUrl ?? undefined} size="sm" />
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
        {files.length ? (
          <motion.div
            className="mb-3 flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
          >
            {files.map((file, index) => {
              const image = file.type.startsWith("image/");
              return (
                <span
                  key={`${file.name}-${index}`}
                  className={`relative flex items-center gap-2 rounded-xl border border-line bg-canvas ${
                    image ? "size-16 overflow-hidden p-0" : "h-16 pr-9 pl-3"
                  }`}
                >
                  {image ? (
                    <img
                      className="size-full object-cover"
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                    />
                  ) : (
                    <>
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-error-bg text-caption-strong text-error-text">
                        {file.name.split(".").pop()?.slice(0, 4).toUpperCase() ?? "FILE"}
                      </span>
                      <span className="flex min-w-0 max-w-[150px] flex-col">
                        <strong className="truncate text-caption-strong text-ink">
                          {file.name}
                        </strong>
                        <small className="text-caption text-ink-tertiary">
                          {formatFileSize(file.size)}
                        </small>
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-surface text-ink-tertiary shadow-xs transition-colors hover:text-ink"
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    aria-label={t("composer.removeAttachmentAria")}
                  >
                    <Icon name="add" size={14} className="rotate-45" />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              className="grid size-16 place-items-center rounded-xl border border-dashed border-line text-ink-tertiary transition-colors hover:bg-subtle hover:text-ink"
              onClick={() => fileRef.current?.click()}
              aria-label={t("composer.attachAria")}
            >
              <Icon name="add" size={20} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {recording ? (
        <div className="mx-auto flex w-full max-w-[920px] items-center gap-3 rounded-full bg-danger-bg px-4 py-3">
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full text-error-text transition-colors hover:bg-error-bg"
            onClick={() => stopRecording(true)}
            aria-label={t("composer.recordCancel")}
          >
            <Icon name="trash" size={19} />
          </button>
          <span className="flex size-2.5 shrink-0 animate-pulse rounded-full bg-danger" />
          <span className="shrink-0 font-numeric text-title-sm text-danger">
            {formatDuration(seconds)}
          </span>
          <small className="min-w-0 flex-1 truncate text-center text-body-xs text-ink-tertiary">
            {t("composer.recordHint")}
          </small>
          <span
            className="hidden min-w-0 flex-1 items-center justify-between gap-[3px] overflow-hidden lg:flex"
            aria-hidden="true"
          >
            {WAVE.map((height, index) => (
              <motion.span
                key={index}
                className="w-[3px] shrink-0 rounded-full bg-action/70"
                animate={{ height: [height * 0.4, height, height * 0.5] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: (index % 7) * 0.08,
                  ease: "easeInOut",
                }}
                style={{ height }}
              />
            ))}
          </span>
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-action text-on-action transition-colors hover:bg-action-hover"
            onClick={() => stopRecording(false)}
            aria-label={t("composer.recordSend")}
          >
            <Icon name="send" size={19} />
          </button>
        </div>
      ) : (
      <div className="mx-auto flex w-full max-w-[920px] items-end gap-3">
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          className="grid size-12 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => (isCompact ? setAttachOpen(true) : fileRef.current?.click())}
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
        {hasContent || editingMessage ? (
          <button
            className="grid size-12 shrink-0 place-items-center rounded-full bg-action text-on-action transition-colors hover:bg-action-hover disabled:opacity-40"
            onClick={submit}
            disabled={(!draft.trim() && !files.length) || sending}
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
        ) : (
          <button
            type="button"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-action text-on-action transition-colors hover:bg-action-hover"
            onClick={startRecording}
            aria-label={t("actionsMenu.voiceAria")}
          >
            <Mic size={20} />
        </button>
        )}
      </div>
      )}

      <AttachmentSheet
        open={attachOpen}
        onOpenChange={setAttachOpen}
        onPick={addFiles}
        onAssignment={onAssignment}
        maxSizeMb={MAX_FILE_MB}
      />

      {previewOpen && files.length ? (
        <ImagePreviewScreen
          files={files}
          caption={draft}
          onCaptionChange={setDraft}
          onRemove={(index) => {
            setFiles((current) => {
              const next = current.filter((_, position) => position !== index);
              if (!next.length) setPreviewOpen(false);
              return next;
            });
          }}
          onAddMore={() => setAttachOpen(true)}
          onCancel={() => {
            setFiles([]);
            setPreviewOpen(false);
          }}
          onSend={() => {
            setPreviewOpen(false);
            void submit();
          }}
        />
      ) : null}
    </div>
  );
}

const MAX_FILE_MB = 20;

function formatDuration(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
