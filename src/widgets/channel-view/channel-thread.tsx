import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { messageApi, messageKeys, upsertMessage } from "@/modules/message";
import { formatMessageTime } from "@/shared/lib";
import type { ChatMessage, ConversationRole } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { RoleTag } from "@/shared/ui/role-tag";

const MAX_COMMENT = 2000;

export interface ChannelThreadProps {
  roomId: string;
  role: ConversationRole;
  post: ChatMessage;
  canComment: boolean;
  currentUserId: string | null;
  onClose: () => void;
}

export function ChannelThread({ roomId, role, post, canComment, currentUserId, onClose }: ChannelThreadProps) {
  const { t } = useTranslation("chat");
  const client = useQueryClient();
  const [text, setText] = useState("");
  const threadKey = messageKeys.thread(roomId, post.id);
  const comments = useQuery({
    queryKey: threadKey,
    queryFn: ({ signal }) => messageApi.getThread(roomId, post.id, { signal }, currentUserId),
  });
  const send = useMutation({
    mutationFn: (body: string) => messageApi.sendComment(roomId, post.id, body, currentUserId),
    onSuccess: (comment) => {
      const next = upsertMessage(client.getQueryData<ChatMessage[]>(threadKey) ?? [], comment);
      client.setQueryData(threadKey, next);
      client.setQueryData<ChatMessage[]>(messageKeys.all(roomId, role), (current) =>
        current?.map((item) => (item.id === post.id ? { ...item, commentCount: next.length } : item))
      );
      setText("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (body && !send.isPending) send.mutate(body);
  }

  const items = comments.data ?? [];

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
          aria-label={t("channel.closeThread")}
          onClick={onClose}
        >
          <Icon name="close" size={20} />
        </button>
        <strong className="min-w-0 flex-1 truncate text-title text-ink">
          {t("channel.threadTitle", { count: items.length })}
        </strong>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <article className="rounded-xl bg-brand-subtle px-4 py-3">
          <small className="text-caption-strong text-brand">
            {post.senderName} · {formatMessageTime(post.createdAt)}
          </small>
          <p className="mt-1 text-body text-ink break-words whitespace-pre-wrap">{post.text || post.attachment?.name || "—"}</p>
        </article>

        {comments.isLoading ? <p className="text-body-sm text-ink-secondary">{t("channel.loading")}</p> : null}
        {!comments.isLoading && !items.length ? (
          <p className="py-6 text-center text-body-sm text-ink-secondary">{t("channel.noComments")}</p>
        ) : null}

        {items.map((comment) => (
          <article key={comment.id} className="flex gap-2.5">
            <Avatar name={comment.senderName} src={comment.senderAvatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-8" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl bg-subtle px-3 py-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <strong className="truncate text-caption-strong text-ink">
                  {comment.senderId === currentUserId ? t("panel.you") : comment.senderName}
                </strong>
                {comment.senderRole === "teacher" || comment.senderRole === "parent" ? (
                  <RoleTag role={comment.senderRole} />
                ) : null}
                <small className="ml-auto shrink-0 text-caption text-ink-tertiary">{formatMessageTime(comment.createdAt)}</small>
              </span>
              <p className="text-body-sm text-ink break-words whitespace-pre-wrap">{comment.text}</p>
            </div>
          </article>
        ))}
      </div>

      {canComment ? (
        <form className="flex shrink-0 items-end gap-2 border-t border-line px-4 py-3" onSubmit={submit}>
          <textarea
            rows={1}
            maxLength={MAX_COMMENT}
            className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-3xl border border-line bg-subtle px-4 py-2.5 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
            value={text}
            placeholder={t("channel.commentPlaceholder")}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) submit(event);
            }}
          />
          <button
            type="submit"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-on-action disabled:opacity-50"
            aria-label={t("channel.sendComment")}
            disabled={!text.trim() || send.isPending}
          >
            <Icon name="send" size={20} />
          </button>
        </form>
      ) : null}
    </section>
  );
}
