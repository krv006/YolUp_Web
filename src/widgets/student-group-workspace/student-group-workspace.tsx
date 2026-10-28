import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ChatHeader, ConversationInfoPanel } from "@/modules/conversation";
import { useCourse } from "@/modules/course";
import { useAssignments } from "@/modules/homework";
import { LiveLessonBar, useLessons } from "@/modules/lesson";
import { MessageComposer, MessageList, PinnedMessageBar, useChatUiStore } from "@/modules/message";
import type { ChatController } from "@/modules/message";
import { useQuizzes } from "@/modules/quiz";
import { VoiceRoomBar, useActiveVoiceRoom, useVoiceUiStore } from "@/modules/voice";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { ChatMessage, Conversation, SendMessagePayload } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { ForwardDialog } from "@/widgets/forward-dialog";
import { StudentLessons } from "./student-lessons";
import { StudentTasks } from "./student-tasks";

type TabId = "chat" | "lessons" | "assignments";

const TABS: TabId[] = ["chat", "lessons", "assignments"];

export interface StudentGroupWorkspaceProps {
  conversation: Conversation;
  chat: ChatController;
  messages: ChatController["messages"];
  sendMessage: ChatController["sendMessage"];
  sendTyping: () => void;
  retryMessage: (message: ChatMessage) => void;
  currentUserId?: string;
}

export function StudentGroupWorkspace({
  conversation,
  chat,
  messages,
  sendMessage,
  sendTyping,
  retryMessage,
  currentUserId,
}: StudentGroupWorkspaceProps) {
  const { t } = useTranslation("student");
  const { t: chatT } = useTranslation("chat");
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const [editingMessageTarget, setEditingMessageTarget] = useState<ChatMessage | null>(null);
  const [forwardTarget, setForwardTarget] = useState<ChatMessage[]>([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [hiddenPin, setHiddenPin] = useState<string | null>(null);
  const isCompact = useIsCompact();
  const courseId = conversation.courseId;
  const voice = useActiveVoiceRoom(courseId);
  const openVoiceCreate = useVoiceUiStore((state) => state.setCreateOpen);
  const selectionMode = useChatUiStore((state) => state.selected.length > 0);
  const announcementMode = Boolean(conversation.announcementOnly);

  const tabParam = params.get("tab") as TabId | null;
  const active: TabId = tabParam && TABS.includes(tabParam) ? tabParam : "chat";

  const course = useCourse(courseId);
  const lessons = useLessons({ course: courseId, page_size: 100 }, active === "lessons");
  const assignments = useAssignments(courseId, active === "assignments" || active === "chat");
  const quizzes = useQuizzes(courseId, active === "assignments" && Boolean(courseId));
  const pinned = chat.pinnedMessages.data?.[0]?.messageId ?? null;
  const submittedById = new Map((assignments.data ?? []).map((item) => [item.id, Boolean(item.mySubmission)]));

  const hydrated: Conversation = {
    ...conversation,
    title: course.data?.title ?? conversation.title,
    subject: course.data?.subject,
    subjectLabel: course.data?.subjectLabel,
    description: course.data?.description,
    memberCount: course.data?.studentCount ?? conversation.memberCount,
  };

  async function send(payload: SendMessagePayload) {
    try {
      if (editingMessageTarget) {
        await chat.updateMessage.mutateAsync({ messageId: editingMessageTarget.id, text: payload.text });
        setEditingMessageTarget(null);
        return;
      }
      await sendMessage.mutateAsync({
        ...payload,
        replyToId: reply?.id ?? null,
        replyTo: reply ? { author: reply.senderName || t("groupWorkspace.replyFallback"), text: reply.text } : undefined,
      });
      setReply(null);
    } catch {
      toast.error(t("groupWorkspace.sendFailed"));
    }
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <section className="chat-page group-workspace max-lg:bg-auth-gradient lg:bg-page-gradient">
          <ChatHeader
            conversation={hydrated}
            backTo={ROUTES.student.chats}
            onToggleInfo={() => setInfoOpen((open) => !open)}
            onVoice={active === "chat" && courseId && !voice.active ? () => openVoiceCreate(true) : undefined}
            workspace
          />
          <div className="hidden lg:contents">
            <LiveLessonBar courseId={courseId} />
          </div>
          <VoiceRoomBar courseId={courseId} courseTitle={hydrated.title} hideIdle />
          <nav
            className={`grid shrink-0 grid-cols-3 gap-2 px-4 pb-1 lg:px-7 lg:pt-3.5 lg:pb-0 ${
              selectionMode ? "pt-1" : "pt-4"
            }`}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`flex h-11 items-center justify-center rounded-full text-body-sm font-medium whitespace-nowrap transition-colors lg:h-9 lg:border lg:text-label lg:font-normal ${
                  active === tab ? "bg-brand text-ink-inverse lg:border-brand" : "bg-surface text-ink lg:border-line"
                }`}
                onClick={() => setParams(tab === "chat" ? {} : { tab })}
              >
                {t(`groupWorkspace.tabs.${tab}`)}
              </button>
            ))}
          </nav>

          {active === "chat" && !selectionMode && announcementMode ? (
            <p className="mx-4 mt-3 flex h-11 shrink-0 items-center gap-2.5 rounded-xl bg-brand-subtle px-4 text-body-sm text-brand lg:mx-7 lg:mt-3.5">
              <Icon name="bolt" size={18} className="shrink-0" />
              <span className="truncate">{chatT("list.announcementLocked")}</span>
            </p>
          ) : active === "chat" && !selectionMode && pinned !== hiddenPin ? (
            <PinnedMessageBar roomId={conversation.id} variant="workspace" onUnpin={setHiddenPin} />
          ) : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="group-tab-content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
            >
              {active === "chat" ? (
                <MessageList
                  messages={messages.data}
                  conversation={hydrated}
                  loading={messages.isLoading}
                  error={messages.isError}
                  onRetry={messages.refetch}
                  onRetryMessage={retryMessage}
                  currentUserId={currentUserId}
                  onReply={setReply}
                  onEdit={setEditingMessageTarget}
                  onDelete={(message, scope) => chat.deleteMessage.mutate({ messageId: message.id, scope })}
                  onReact={(message, emoji) => chat.toggleReaction.mutate({ messageId: message.id, emoji })}
                  pinnedIds={(chat.pinnedMessages.data ?? []).map((item) => item.messageId)}
                  onPin={(message, isPinned) => chat.pinMessage.mutate({ messageId: message.id, pinned: isPinned })}
                  onForward={(items) => setForwardTarget(items)}
                  onBulkDelete={(messageIds, scope) => chat.deleteMessages.mutate({ messageIds, scope })}
                  onOpenAssignment={(id) => navigate(ROUTES.student.homeworkItem(id))}
                  assignmentSubmitted={(id) => submittedById.get(id) ?? null}
                  variant="workspace"
                />
              ) : null}
              {active === "lessons" ? (
                <StudentLessons
                  lessons={lessons.data}
                  loading={lessons.isLoading}
                  currentUserId={currentUserId}
                  teacher={course.data?.teacher}
                />
              ) : null}
              {active === "assignments" ? (
                <StudentTasks
                  assignments={assignments.data ?? []}
                  quizzes={(quizzes.data ?? []).filter((quiz) => quiz.courseId === courseId)}
                  loading={assignments.isLoading}
                  courseTitle={hydrated.title}
                  courseImage={course.data?.avatarUrl ?? conversation.imageUrl}
                  courseTone={course.data?.color}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>

          {active === "chat" && !selectionMode && !announcementMode ? (
            <MessageComposer
              key={editingMessageTarget?.id ?? "compose"}
              onSend={send}
              onTyping={sendTyping}
              sending={sendMessage.isPending || chat.updateMessage.isPending}
              replyTo={reply}
              editingMessage={editingMessageTarget}
              currentUserId={currentUserId}
              onCancelContext={() => {
                setReply(null);
                setEditingMessageTarget(null);
              }}
              roomId={conversation.id}
              variant="workspace"
            />
          ) : null}

          <ForwardDialog
            open={forwardTarget.length > 0}
            onOpenChange={(open) => !open && setForwardTarget([])}
            messages={forwardTarget}
            role="student"
            pending={chat.forwardMessages.isPending}
            onConfirm={(roomIds) =>
              chat.forwardMessages.mutate(
                { messageIds: forwardTarget.map((item) => item.id), roomIds },
                { onSuccess: () => setForwardTarget([]) }
              )
            }
          />
        </section>
      </div>

      {isCompact ? (
        <ConversationInfoPanel conversation={hydrated} open={infoOpen} onOpenChange={setInfoOpen} />
      ) : infoOpen ? (
        <ConversationInfoPanel embedded conversation={hydrated} open onOpenChange={setInfoOpen} />
      ) : null}
    </div>
  );
}
