import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, LoaderCircle, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { useQuery } from "@tanstack/react-query";
import { formatRelativeShort } from "@/shared/lib";
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
  variant?: "default" | "workspace";
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
  variant = "default",
}: MessageComposerProps) {
  const workspace = variant === "workspace";
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
    <div
      className={`relative shrink-0 bg-surface px-4 pt-2.5 ${
        workspace ? "lg:mx-7 lg:mb-3 lg:rounded-2xl lg:py-2.5" : "lg:border-t lg:border-line lg:px-6 lg:py-4"
      } ${context ? "pb-3.5" : "pb-6"}`}
    >
      {online ? null : (
        <div className="mb-2 flex items-center gap-1.5 text-saffron-strong lg:mb-3 lg:gap-2.5 lg:rounded-xl lg:bg-saffron-subtle lg:px-3 lg:py-2">
          <Icon name="wifi" size={16} className="shrink-0 lg:hidden" />
          <Icon name="error" size={16} className="hidden shrink-0 lg:block" />
          <span className="text-caption lg:hidden">{t("offline.composerShort")}</span>
          <span className="hidden text-caption lg:inline">{t("offline.composer")}</span>
        </div>
      )}

      <AnimatePresence>
        {mention ? (
          <motion.div
            className="absolute right-4 bottom-full left-4 z-30 -mb-[5px] flex flex-col overflow-hidden rounded-xl bg-surface px-2 pt-6.5 pb-2 shadow-xl lg:right-auto lg:left-6 lg:mb-2 lg:w-[280px] lg:rounded-2xl lg:border lg:border-line lg:p-0"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            <span className="px-2.5 pb-0.75 text-caption text-ink-secondary uppercase lg:px-4 lg:pt-3 lg:pb-2 lg:text-caption-strong lg:text-ink-tertiary lg:normal-case">
              {t("mention.title")}
            </span>
            {suggestions.length ? (
              suggestions.map((student, index) => (
                <button
                  key={student.id}
                  type="button"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3.5 text-left transition-colors lg:rounded-none lg:py-2.5 ${
                    index === activeMention ? "bg-brand-subtle lg:bg-subtle" : "hover:bg-subtle"
                  }`}
                  onMouseEnter={() => setActiveMention(index)}
                  onClick={() => applyMention(student.username, student.id)}
                >
                  <Avatar
                    name={student.name}
                    src={student.avatarUrl ?? undefined}
                    size="sm"
                    className="max-lg:[&_.avatar]:size-10"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title leading-5 text-ink lg:text-label-strong">{student.name}</strong>
                    <small
                      className={`truncate text-body-sm lg:text-caption lg:text-ink-tertiary ${
                        student.role === "teacher" ? "text-brand" : "text-ink-secondary"
                      }`}
                    >
                      <span className="lg:hidden">
                        {student.role === "teacher"
                          ? t("mention.teacher")
                          : `@${student.username}${
                              student.isOnline
                                ? ` · ${t("mention.online")}`
                                : student.lastSeenAt
                                  ? ` · ${formatRelativeShort(student.lastSeenAt)}`
                                  : ""
                            }`}
                      </span>
                      <span className="hidden lg:inline">@{student.username}</span>
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
            className="mt-2.5 mb-4 flex items-center gap-2.5 pl-1 lg:mt-0 lg:mb-3 lg:gap-3 lg:rounded-xl lg:border lg:border-line lg:bg-canvas lg:px-3 lg:py-2"
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 5, height: 0 }}
          >
            <i className="w-[3px] shrink-0 self-stretch rounded-full bg-brand not-italic lg:hidden" />
            <span className="hidden size-8 shrink-0 place-items-center rounded-full bg-action-subtle text-action lg:grid">
              {editingMessage ? <Icon name="edit" size={16} /> : <Icon name="arrow-back" size={17} />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-caption-strong text-brand lg:text-ink">
                {editingMessage
                  ? t("composer.editingLabel")
                  : `${
                      replyTo?.senderName ||
                      (replyTo?.senderId === currentUserId
                        ? t("composer.youLabel")
                        : t("composer.replyFallback"))
                    }`}
              </strong>
              <small className="truncate text-body-sm leading-4 text-ink-secondary lg:text-caption lg:text-ink-tertiary">
                {context.text}
              </small>
            </span>
            <button
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-secondary hover:bg-subtle hover:text-ink lg:text-ink-tertiary"
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
        <div className="flex items-center gap-2.25 lg:hidden">
          <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full bg-danger-bg px-4">
            <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-danger" />
            <span className="shrink-0 font-numeric text-title-sm text-error-text">
              {formatDuration(seconds)}
            </span>
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-body-sm text-ink-secondary"
              onClick={() => stopRecording(true)}
            >
              ‹ {t("composer.recordSwipeCancel")}
            </button>
          </div>
          <button
            type="button"
            className="grid size-13 shrink-0 place-items-center rounded-full bg-danger text-on-action"
            onClick={() => stopRecording(false)}
            aria-label={t("composer.recordSend")}
          >
            <Icon name="mic" size={24} />
          </button>
        </div>
      ) : null}
      {recording ? (
        <div className="mx-auto hidden w-full max-w-[920px] items-center gap-3 rounded-full bg-danger-bg px-4 py-3 lg:flex">
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
      <div className={`mx-auto flex w-full max-w-[920px] items-end gap-2.25 ${workspace ? "lg:gap-2" : "lg:gap-3"}`}>
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
          className={`grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 ${workspace ? "" : "lg:size-12"}`}
          onClick={() => (isCompact ? setAttachOpen(true) : fileRef.current?.click())}
          disabled={!allowAttachments || Boolean(editingMessage)}
          title={allowAttachments ? undefined : t("composer.attachUnavailable")}
          aria-label={t("composer.attachAria")}
        >
          <Icon name="add" size={22} />
        </button>
        <div
          className={`flex min-h-11 min-w-0 flex-1 items-end gap-2 rounded-[22px] bg-subtle py-2.5 pr-3 pl-4.5 ${
            workspace ? "lg:py-3 lg:pl-4" : "lg:rounded-3xl lg:border lg:border-line lg:bg-canvas lg:px-5 lg:py-3"
          }`}
        >
          <textarea
            className={`max-h-[120px] min-w-0 flex-1 resize-none bg-transparent text-body text-ink outline-none placeholder:text-ink-secondary ${
              workspace ? "lg:text-body-sm" : "lg:placeholder:text-ink-tertiary"
            }`}
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
            className={`mb-0.5 hidden size-7 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:text-ink ${workspace ? "" : "lg:grid"}`}
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
                className={`grid size-6 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:text-ink ${
                  workspace ? "" : "lg:mb-0.5 lg:size-7 lg:text-ink-tertiary"
                }`}
                aria-label={t("composer.emojiAria")}
              >
                <Icon name="emoji" size={20} />
              </button>
            </DropdownTrigger>
            <DropdownContent
              className="emoji-picker max-lg:!flex max-lg:h-12.5 max-lg:w-66.5 max-lg:!min-w-0 max-lg:items-center max-lg:justify-between max-lg:!rounded-full max-lg:!border-0 max-lg:!px-3 max-lg:!py-0 max-lg:!shadow-xl max-lg:[&_.dropdown-item]:!size-9 max-lg:[&_.dropdown-item]:!text-[22px]"
              sideOffset={isCompact ? 46 : 8}
              alignOffset={isCompact ? -11 : 0}
            >
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
            className={`grid size-11 shrink-0 place-items-center rounded-full bg-action text-on-action transition-colors hover:bg-action-hover disabled:opacity-40 ${workspace ? "" : "lg:size-12"}`}
            onClick={submit}
            disabled={(!draft.trim() && !files.length) || sending}
            aria-label={editingMessage ? t("composer.saveEditAria") : t("composer.sendAria")}
          >
            {sending ? (
              <LoaderCircle className="animate-spin" size={19} />
            ) : editingMessage ? (
              <>
                <Icon name="check" size={22} className="lg:hidden" />
                <Icon name="edit" size={18} className="hidden lg:block" />
              </>
            ) : (
              <Icon name="send" size={20} />
            )}
          </button>
        ) : (
          <button
            type="button"
            className={`grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted lg:bg-action lg:text-on-action lg:hover:bg-action-hover ${workspace ? "" : "lg:size-12"}`}
            onClick={startRecording}
            aria-label={t("actionsMenu.voiceAria")}
          >
            <Icon name="mic" size={22} className={workspace ? undefined : "lg:hidden"} />
            {workspace ? null : <Mic size={20} className="hidden lg:block" />}
        </button>
        )}
      </div>
      )}

      <AttachmentSheet
        open={attachOpen}
        onOpenChange={setAttachOpen}
        roomId={roomId ?? undefined}
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
