import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CalendarDays, CheckCircle2, ClipboardList } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import { useAttendance, useAttendanceSummary } from "@/modules/attendance";
import { useCourse } from "@/modules/course";
import {
  AssignmentDetailDialog,
  useAssignments,
  useCreateAssignment,
  useDeleteAssignment,
  useUpdateAssignment,
} from "@/modules/homework";
import {
  FinishLessonDialog,
  LessonRatingsDialog,
  LiveLessonBar,
  useCancelLesson,
  useCreateLesson,
  useCreateLessonSchedule,
  useDeleteLesson,
  useLessons,
  useUpdateLesson,
} from "@/modules/lesson";
import { useLessonPresence } from "@/modules/live";
import {
  AddQuizDialog,
  AssignQuizDialog,
  QuizAttemptsDialog,
  quizDisplayTitle,
  useAssignQuizToCourse,
  useCreateQuiz,
  quizErrorMessage,
  usePublishQuiz,
  useRemoveGroupAudio,
  useUploadGroupAudio,
  useQuiz,
  useQuizAttempts,
  useQuizzes,
  useUpdateQuiz,
} from "@/modules/quiz";
import { ChatHeader, ConversationInfoPanel } from "@/modules/conversation";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ForwardDialog } from "@/widgets/forward-dialog";
import { VoiceRoomBar, useActiveVoiceRoom, useVoiceUiStore } from "@/modules/voice";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { MobileEmptyCard } from "@/shared/ui/mobile-page";
import { RowSkeleton } from "@/shared/ui/row-skeleton";
import { AddQuizMenu } from "./add-quiz-menu";
import { MobileAssignmentList } from "./mobile-assignment-list";
import { MessageComposer, MessageList, PinnedMessageBar, useChatUiStore } from "@/modules/message";
import type {
  Assignment,
  AttendanceRow,
  ChatMessage,
  Conversation,
  Lesson,
  QuizImportWarning,
  QuizSummary,
  SendMessagePayload,
} from "@/shared/types";
import type { ChatController } from "@/modules/message";
import { Avatar, Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import {
  AddAssignmentDialog,
  AddLessonDialog,
  type LessonDraft,
  type LessonScheduleDraft,
} from "./group-action-dialogs";
import { CancelLessonDialog } from "./cancel-lesson-dialog";
import { LessonBoard } from "./lesson-board";

type TabId = "chat" | "lessons" | "assignments" | "attendance";

function useTabs(): Array<{ id: TabId; label: string; icon: typeof BookOpen }> {
  const { t } = useTranslation("group");
  return [
    { id: "chat", label: t("tabs.chat"), icon: BookOpen },
    { id: "lessons", label: t("tabs.lessons"), icon: CalendarDays },
    { id: "assignments", label: t("tabs.assignments"), icon: ClipboardList },
    { id: "attendance", label: t("tabs.attendance"), icon: CheckCircle2 },
  ];
}


export interface GroupWorkspaceProps {
  conversation: Conversation;
  chat: ChatController;
  messages: ChatController["messages"];
  sendMessage: ChatController["sendMessage"];
  sendTyping: () => void;
  retryMessage: (message: ChatMessage) => void;
}

export function GroupWorkspace({
  conversation,
  chat,
  messages,
  sendMessage,
  sendTyping,
  retryMessage,
}: GroupWorkspaceProps) {
  const { t } = useTranslation("group");
  const TABS = useTabs();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const [editingMessageTarget, setEditingMessageTarget] = useState<ChatMessage | null>(null);
  const [forwardTarget, setForwardTarget] = useState<ChatMessage[]>([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const isCompact = useIsCompact();
  const courseId = conversation.courseId;
  const voice = useActiveVoiceRoom(courseId);
  const openVoiceCreate = useVoiceUiStore((state) => state.setCreateOpen);
  const selectionMode = useChatUiStore((state) => state.selected.length > 0);

  const tabParam = params.get("tab") as TabId | null;
  const activeTab: TabId = TABS.some((item) => item.id === tabParam) ? (tabParam as TabId) : "chat";

  const course = useCourse(courseId);
  const lessons = useLessons(
    { course: courseId, page_size: 100 },
    activeTab === "lessons" || activeTab === "attendance"
  );
  const assignments = useAssignments(courseId, activeTab === "assignments" || activeTab === "chat");
  const attendance = useAttendance({ page_size: 100 }, activeTab === "attendance");

  async function send(payload: SendMessagePayload) {
    try {
      if (editingMessageTarget) {
        await chat.updateMessage.mutateAsync({
          messageId: editingMessageTarget.id,
          text: payload.text,
        });
        setEditingMessageTarget(null);
        return;
      }
      await sendMessage.mutateAsync({
        ...payload,
        replyToId: reply?.id ?? null,
        replyTo: reply ? { author: reply.senderName || t("replyFallback"), text: reply.text } : undefined,
      });
      setReply(null);
    } catch {
      toast.error(t("sendFailed"));
    }
  }

  const hydrated: Conversation = {
    ...conversation,
    title: course.data?.title ?? conversation.title,
    subject: course.data?.subject,
    subjectLabel: course.data?.subjectLabel,
    description: course.data?.description,
    memberCount: course.data?.studentCount ?? 0,
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <section className="chat-page group-workspace max-lg:bg-auth-gradient lg:bg-page-gradient">
      <ChatHeader
        conversation={hydrated}
        onToggleInfo={() => setInfoOpen((open) => !open)}
        onVoice={activeTab === "chat" && courseId && !voice.active ? () => openVoiceCreate(true) : undefined}
        workspace
      />
      <div className="hidden lg:contents">
        <LiveLessonBar courseId={courseId} />
      </div>
      <VoiceRoomBar courseId={courseId} courseTitle={hydrated.title} hideIdle />
      <nav
        className={`grid shrink-0 grid-cols-4 gap-2 px-4 pb-1 lg:px-7 lg:pt-3.5 lg:pb-0 ${
          selectionMode ? "pt-1" : "pt-4"
        }`}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`flex h-11 items-center justify-center rounded-full text-body-sm font-medium whitespace-nowrap transition-colors lg:h-9 lg:border lg:text-label lg:font-normal ${
                active ? "bg-brand text-ink-inverse lg:border-brand" : "bg-surface text-ink lg:border-line"
              }`}
              onClick={() => setParams(tab.id === "chat" ? {} : { tab: tab.id })}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "chat" && !selectionMode && conversation.announcementOnly ? (
        <p className="mx-4 mt-3 flex h-11 shrink-0 items-center gap-2.5 rounded-xl bg-brand-subtle px-4 text-body-sm text-brand lg:hidden">
          <Icon name="bolt" size={18} className="shrink-0" />
          <span className="truncate">{t("announcementBanner")}</span>
        </p>
      ) : null}
      {activeTab === "chat" && !selectionMode ? (
        <div className={conversation.announcementOnly ? "hidden lg:contents" : "contents"}>
          <PinnedMessageBar
            roomId={conversation.id}
            variant="workspace"
            onUnpin={(messageId) => chat.pinMessage.mutate({ messageId, pinned: false })}
          />
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="group-tab-content"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
        >
          {activeTab === "chat" ? (
            <MessageList
              messages={messages.data}
              conversation={hydrated}
              loading={messages.isLoading}
              error={messages.isError}
              onRetry={messages.refetch}
              onRetryMessage={retryMessage}
              currentUserId={user?.id}
              onReply={setReply}
              onEdit={setEditingMessageTarget}
              onDelete={(message, scope) =>
                chat.deleteMessage.mutate({ messageId: message.id, scope })
              }
              onReact={(message, emoji) =>
                chat.toggleReaction.mutate({ messageId: message.id, emoji })
              }
              pinnedIds={(chat.pinnedMessages.data ?? []).map((item) => item.messageId)}
              onPin={(message, pinned) =>
                chat.pinMessage.mutate({ messageId: message.id, pinned })
              }
              onForward={(items) => setForwardTarget(items)}
              onBulkDelete={(messageIds, scope) =>
                chat.deleteMessages.mutate({ messageIds, scope })
              }
              variant="workspace"
            />
          ) : null}
          {activeTab === "lessons" ? (
            <LessonsPanel
              courseId={courseId}
              lessons={lessons.data}
              loading={lessons.isLoading}
              studentCount={hydrated.memberCount ?? 0}
            />
          ) : null}
          {activeTab === "assignments" ? (
            <AssignmentsPanel
              courseId={courseId}
              assignments={assignments.data}
              loading={assignments.isLoading}
              isLanguageSubject={Boolean(course.data?.isLanguageSubject)}
            />
          ) : null}
          {activeTab === "attendance" ? (
            <AttendancePanel
              courseId={courseId}
              lessons={lessons.data}
              rows={attendance.data}
              loading={attendance.isLoading}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {activeTab === "chat" && !selectionMode ? (
        <MessageComposer
          key={editingMessageTarget?.id ?? "compose"}
          onSend={send}
          onTyping={sendTyping}
          sending={sendMessage.isPending || chat.updateMessage.isPending}
          replyTo={reply}
          editingMessage={editingMessageTarget}
          onCancelContext={() => {
            setReply(null);
            setEditingMessageTarget(null);
          }}
          currentUserId={user?.id}
          roomId={conversation.id}
          onAssignment={() => setParams({ tab: "assignments" })}
          variant="workspace"
        />
      ) : null}

      <ForwardDialog
        open={forwardTarget.length > 0}
        onOpenChange={(open) => !open && setForwardTarget([])}
        messages={forwardTarget}
        role="teacher"
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
        <ConversationInfoPanel
          conversation={hydrated}
          open={infoOpen}
          onOpenChange={setInfoOpen}
        />
      ) : infoOpen ? (
        <ConversationInfoPanel
          embedded
          conversation={hydrated}
          open
          onOpenChange={setInfoOpen}
        />
      ) : null}
    </div>
  );
}

function PanelHeading({
  eyebrow,
  title,
  subtitle,
  className = "flex-1",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-[3px] ${className}`}>
      <span className="text-caption text-ink-secondary uppercase">{eyebrow}</span>
      <h2 className="text-[24px]/[26px] font-bold text-ink">{title}</h2>
      {subtitle ? <p className="truncate text-body-sm text-ink-secondary lg:text-body-xs">{subtitle}</p> : null}
    </div>
  );
}

interface LessonsPanelProps {
  courseId: string | null;
  lessons?: Lesson[];
  loading: boolean;
  studentCount: number;
}

function LessonsPanel({ courseId, lessons = [], loading, studentCount }: LessonsPanelProps) {
  const { t } = useTranslation("group");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Lesson | null>(null);
  const [finishTarget, setFinishTarget] = useState<Lesson | null>(null);
  const [ratingsTarget, setRatingsTarget] = useState<Lesson | null>(null);
  const navigate = useNavigate();
  const create = useCreateLesson();
  const createSchedule = useCreateLessonSchedule();
  const update = useUpdateLesson();
  const remove = useDeleteLesson();
  const cancelLesson = useCancelLesson();

  const liveLesson = lessons.find((lesson) => lesson.status === "live") ?? null;
  const presence = useLessonPresence(liveLesson?.id, Boolean(liveLesson));

  const allLessons = useLessons({ page_size: 200 }, dialog);
  const courseQuizzes = useQuizzes(courseId, dialog && Boolean(courseId));

  const quizOptions = useMemo(
    () =>
      (courseQuizzes.data ?? [])
        .filter((quiz) => !quiz.lessonId || quiz.lessonId === editing?.id)
        .map((quiz) => ({ id: quiz.id, title: quizDisplayTitle(quiz) })),
    [courseQuizzes.data, editing]
  );

  function save(form: LessonDraft) {
    const payload = { ...form, courseId };
    const request = editing
      ? update.mutateAsync({ id: editing.id, form: payload })
      : create.mutateAsync(payload);
    return request.then(() => {
      setDialog(false);
      setEditing(null);
    });
  }

  function saveSchedule(draft: LessonScheduleDraft) {
    if (!courseId) return Promise.resolve();
    return createSchedule
      .mutateAsync({
        courseId,
        title: draft.topic,
        time: draft.time,
        durationMinutes: Number(draft.duration) || 45,
        weekdays: draft.weekdays,
        startsOn: draft.startsOn,
        endsOn: draft.endsOn,
        dates: draft.dates,
      })
      .then(() => {
        setDialog(false);
        setEditing(null);
      });
  }

  const actions = {
    onJoin: (lesson: Lesson) => navigate(ROUTES.live(lesson.id)),
    onFinish: setFinishTarget,
    onRatings: setRatingsTarget,
    onDelete: setDeleteTarget,
    onRecording: (lesson: Lesson) => navigate(ROUTES.teacher.recording(lesson.id)),
    onEdit: (lesson: Lesson) => {
      setEditing(lesson);
      setDialog(true);
    },
  };

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 pt-5 pb-8 lg:gap-3.5 lg:px-7 lg:pt-3.5 lg:pb-7">
      <div className="flex shrink-0 items-end gap-1 lg:gap-4">
        <PanelHeading eyebrow={t("lessons.eyebrow")} title={t("lessons.title")} subtitle={t("lessons.subtitle")} />
        <button
          type="button"
          className={`h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand-subtle px-[15px] text-button whitespace-nowrap text-brand transition-colors hover:bg-brand-subtle/70 lg:h-[42px] ${
            lessons.length || loading ? "flex" : "hidden lg:flex"
          }`}
          onClick={() => {
            setEditing(null);
            setDialog(true);
          }}
        >
          <Icon name="add" size={16} /> {t("lessons.addLesson")}
        </button>
      </div>

      {loading && !lessons.length ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <i className="h-3 w-[90px] rounded-full bg-skeleton lg:hidden" />
          {Array.from({ length: 3 }, (_, index) => (
            <span
              key={index}
              className="flex flex-col gap-5 rounded-xl bg-surface p-4 lg:h-38 lg:max-w-[636px] lg:flex-row lg:items-center lg:gap-3 lg:py-0"
            >
              <span className="flex h-14 items-start gap-3 lg:h-auto">
                <i className="size-14 shrink-0 rounded-[14px] bg-skeleton" />
                <span className="flex flex-col gap-2.5">
                  <i className="h-3.5 w-[90px] rounded-full bg-skeleton" />
                  <i className="h-4 w-[170px] rounded-full bg-skeleton" />
                  <i className="h-3 w-30 rounded-full bg-skeleton" />
                </span>
              </span>
              <span className="grid grid-cols-2 gap-2 lg:ml-auto lg:flex">
                <i className="h-11 rounded-full bg-skeleton lg:w-[130px]" />
                <i className="h-11 rounded-full bg-skeleton lg:w-[130px]" />
              </span>
            </span>
          ))}
        </div>
      ) : (
        <LessonBoard
          lessons={lessons}
          studentCount={studentCount}
          joinedCount={liveLesson ? (liveLesson.joinedCount ?? presence.data?.count ?? null) : null}
          onAdd={() => {
            setEditing(null);
            setDialog(true);
          }}
          onJoin={actions.onJoin}
          onEdit={actions.onEdit}
          onCancel={setCancelTarget}
          onRecording={actions.onRecording}
          onRatings={actions.onRatings}
        />
      )}

      <AddLessonDialog
        key={editing?.id ?? "new-lesson"}
        onDelete={editing ? () => setDeleteTarget(editing) : undefined}
        open={dialog}
        onOpenChange={(open) => {
          setDialog(open);
          if (!open) setEditing(null);
        }}
        initialValues={editing}
        existingLessons={allLessons.data ?? []}
        quizOptions={quizOptions}
        onCreate={save}
        onCreateSchedule={saveSchedule}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        icon="trash"
        title={t("lessons.deleteConfirmTitle", { title: deleteTarget?.title ?? "" })}
        description={t("lessons.deleteDialogDescription", { title: deleteTarget?.title ?? "" })}
        confirmLabel={t("lessons.delete")}
        cancelLabel={t("lessons.cancel")}
        pending={remove.isPending}
        onConfirm={() =>
          deleteTarget && remove.mutateAsync(deleteTarget.id).then(() => setDeleteTarget(null))
        }
      />
      <CancelLessonDialog
        lesson={cancelTarget}
        pending={cancelLesson.isPending}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        onConfirm={(lesson, scope) =>
          cancelLesson
            .mutateAsync({ id: lesson.id, scope: scope === "following" ? "series" : "one" })
            .then(() => setCancelTarget(null))
        }
      />
      <FinishLessonDialog
        lesson={finishTarget}
        onOpenChange={(open) => {
          if (!open) setFinishTarget(null);
        }}
      />
      <LessonRatingsDialog
        lesson={ratingsTarget}
        onOpenChange={(open) => {
          if (!open) setRatingsTarget(null);
        }}
      />
    </div>
  );
}

interface AssignmentsPanelProps {
  courseId: string | null;
  assignments?: Assignment[];
  loading: boolean;
  isLanguageSubject: boolean;
}

function useAssignmentHighlight(assignmentId: string | null, ready: boolean) {
  useEffect(() => {
    if (!assignmentId || !ready) return;
    document
      .querySelector(`[data-assignment-id="${CSS.escape(assignmentId)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [assignmentId, ready]);
}

function AssignmentsPanel({
  courseId,
  assignments = [],
  loading,
  isLanguageSubject,
}: AssignmentsPanelProps) {
  const { t } = useTranslation("group");
  const [dialog, setDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assignmentParams, setAssignmentParams] = useSearchParams();
  const highlightId = assignmentParams.get("assignment");
  const linkedSubmissionId = assignmentParams.get("submission");
  const linkedAssignmentId = linkedSubmissionId ? highlightId : null;
  useAssignmentHighlight(highlightId, (assignments?.length ?? 0) > 0);
  const create = useCreateAssignment();
  const update = useUpdateAssignment();
  const remove = useDeleteAssignment();
  const [quizDialog, setQuizDialog] = useState(false);
  const [bankDialog, setBankDialog] = useState(false);
  const assignQuiz = useAssignQuizToCourse();
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const publishQuiz = usePublishQuiz();
  const [importedWarnings, setImportedWarnings] = useState<QuizImportWarning[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [editQuizTarget, setEditQuizTarget] = useState<QuizSummary | null>(null);
  const editQuizDetail = useQuiz(editQuizTarget?.id ?? null);
  const editQuizAttempts = useQuizAttempts(editQuizTarget?.id ?? null, Boolean(editQuizTarget));
  const uploadAudio = useUploadGroupAudio(editQuizTarget?.id ?? "");
  const removeAudio = useRemoveGroupAudio(editQuizTarget?.id ?? "");
  const { t: quizT } = useTranslation("quiz");
  const course = useCourse(courseId);

  const lessons = useLessons({ course: courseId, page_size: 100 }, dialog);
  const courseQuizzes = useQuizzes(courseId, Boolean(courseId));
  const [attemptsOf, setAttemptsOf] = useState<QuizSummary | null>(null);
  const courseQuizList = useMemo(
    () => (courseQuizzes.data ?? []).filter((quiz) => quiz.courseId === courseId),
    [courseQuizzes.data, courseId]
  );
  const allQuizzes = useQuizzes(null, quizDialog || bankDialog);
  const courseSubject = course.data?.subject ?? "";
  function closeQuizEditor() {
    setEditQuizTarget(null);
    setImportedWarnings([]);
    setPublishError(null);
  }

  // Tayyor (guruhsiz) testlar: avval shu guruh fanidagilar — AI yaratgan testlar ham shu yerda
  const bankOptions = useMemo(
    () =>
      (allQuizzes.data ?? [])
        .filter((quiz) => !quiz.courseId)
        .sort((a, b) => Number(b.subject === courseSubject) - Number(a.subject === courseSubject))
        .map((quiz) => ({
          id: quiz.id,
          label: `${quizDisplayTitle(quiz)} · ${t("assignments.quizQuestions", { count: quiz.questionCount })}${
            quiz.status === "draft" ? ` · ${quizT("teacherPage.draftBadge")}` : ""
          }`,
        })),
    [allQuizzes.data, courseSubject, quizT, t]
  );

  const quizTitleOptions = useMemo(() => {
    const subjectBank = (allQuizzes.data ?? []).filter(
      (quiz) => !quiz.courseId && Boolean(courseSubject) && quiz.subject === courseSubject
    );
    return [...courseQuizList, ...subjectBank]
      .map((quiz) => ({ id: quiz.id, title: quizDisplayTitle(quiz) }))
      .filter((quiz) => quiz.title);
  }, [allQuizzes.data, courseQuizList, courseSubject]);

  const dialogs = (
    <>
        <QuizAttemptsDialog
          courseId={courseId}
          quizId={attemptsOf?.id ?? null}
          open={Boolean(attemptsOf)}
          onOpenChange={(open) => {
            if (!open) setAttemptsOf(null);
          }}
          title={attemptsOf?.title}
        />

        {editQuizTarget && editQuizDetail.data && !editQuizAttempts.isLoading ? (
          <AddQuizDialog
            key={editQuizTarget.id}
            open
            onOpenChange={(next) => {
              if (!next) closeQuizEditor();
            }}
            courses={[]}
            editQuiz={editQuizDetail.data}
            initialWarnings={importedWarnings}
            uploadingAudio={uploadAudio.isPending}
            onUploadAudio={(groupId, file) => uploadAudio.mutate({ groupId, file })}
            onRemoveAudio={(groupId) => removeAudio.mutate(groupId)}
            startOnQuestions={importedWarnings.length > 0}
            questionsLocked={(editQuizAttempts.data ?? []).length > 0}
            saving={updateQuiz.isPending}
            publishing={publishQuiz.isPending}
            publishError={publishError}
            showSchedule
            onCreate={() => undefined}
            onUpdate={(values) =>
              updateQuiz.mutateAsync({ id: editQuizTarget.id, values }).then(() => closeQuizEditor())
                .catch((error: unknown) => setPublishError(quizErrorMessage(error)))
            }
            onPublish={() => {
              setPublishError(null);
              publishQuiz
                .mutateAsync(editQuizTarget.id)
                .then(() => closeQuizEditor())
                .catch((error: unknown) => setPublishError(quizErrorMessage(error)));
            }}
          />
        ) : null}

        <AssignQuizDialog
          open={bankDialog && Boolean(courseId)}
          onOpenChange={setBankDialog}
          quizzes={bankOptions}
          courseId={courseId}
          pending={assignQuiz.isPending}
          onSubmit={(value) => assignQuiz.mutateAsync(value).then(() => setBankDialog(false))}
        />

        {quizDialog && courseId ? (
          <AddQuizDialog
            open
            onOpenChange={(open) => {
              if (!open) setQuizDialog(false);
            }}
            courses={[{ id: courseId, title: course.data?.title ?? "" }]}
            showSchedule
            existingQuizzes={quizTitleOptions}
            onImported={(result) => {
              setImportedWarnings(result.warnings);
              setPublishError(null);
              setQuizDialog(false);
              setEditQuizTarget({ ...result.quiz });
            }}
            onCreate={(values) =>
              createQuiz.mutate(values, { onSuccess: () => setQuizDialog(false) })
            }
          />
        ) : null}

        <AddAssignmentDialog
          key={editingAssignment?.id ?? "new"}
          open={dialog}
          onOpenChange={(open) => {
            setDialog(open);
            if (!open) setEditingAssignment(null);
          }}
          lessons={lessons.data ?? []}
          isLanguageSubject={isLanguageSubject}
          initialValues={editingAssignment}
          onCreate={(form) => {
            const payload = { ...form, courseId };
            const request = editingAssignment
              ? update.mutateAsync({ id: editingAssignment.id, form: payload })
              : create.mutateAsync(payload);
            request.then(() => {
              setDialog(false);
              setEditingAssignment(null);
            });
          }}
        />
        <Dialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          {deleteTarget && (
            <DialogContent
              title={t("assignments.deleteDialogTitle")}
              description={t("assignments.deleteDialogDescription", { title: deleteTarget.title })}
            >
              <div className="dialog-actions">
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                  {t("assignments.cancel")}
                </Button>
                <Button
                  loading={remove.isPending}
                  onClick={() => remove.mutateAsync(deleteTarget.id).then(() => setDeleteTarget(null))}
                >
                  {t("assignments.delete")}
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
        <AssignmentDetailDialog
          key={linkedAssignmentId ?? detailId ?? "none"}
          assignmentId={detailId ?? linkedAssignmentId}
          openSubmissionId={linkedSubmissionId}
          open={Boolean(detailId || linkedSubmissionId)}
          onOpenChange={(open: boolean) => {
            if (open) return;
            setDetailId(null);
            if (linkedSubmissionId) {
              const next = new URLSearchParams(assignmentParams);
              next.delete("submission");
              setAssignmentParams(next, { replace: true });
            }
          }}
        />
    </>
  );

  const hasItems = assignments.length > 0 || courseQuizList.length > 0;

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto bg-transparent px-4 pt-5 pb-8 lg:gap-3.5 lg:px-7 lg:pt-3.5">
      <div className="flex shrink-0 flex-col gap-5 lg:flex-row lg:items-end lg:gap-4">
        <PanelHeading
          eyebrow={t("assignments.eyebrow")}
          title={t("assignments.title")}
          subtitle={t("assignments.subtitleShort")}
        />
        {hasItems || loading ? (
          <div className="grid shrink-0 grid-cols-2 gap-2.5 lg:mb-0.5 lg:flex lg:flex-row-reverse lg:items-end">
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-button whitespace-nowrap text-on-action transition-colors hover:bg-brand-strong lg:h-[42px] lg:px-[15px]"
              onClick={() => setDialog(true)}
            >
              <Icon name="add" size={16} />
              {t("assignments.addAssignment")}
            </button>
            <AddQuizMenu
              className="px-4 lg:px-[13px]"
              onFromBank={() => setBankDialog(true)}
              onCreate={() => setQuizDialog(true)}
            />
          </div>
        ) : null}
      </div>

      {loading && !hasItems ? (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-3.5" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className="flex flex-col gap-3 rounded-xl bg-surface p-4">
              <span className="flex items-center gap-3">
                <i className="size-11 shrink-0 rounded-md bg-skeleton" />
                <span className="flex flex-col gap-2">
                  <i className="h-3.5 w-40 rounded-full bg-skeleton" />
                  <i className="h-3 w-28 rounded-full bg-skeleton" />
                </span>
              </span>
              <i className="h-6 w-24 rounded-full bg-skeleton" />
              <i className="h-1.5 rounded-full bg-skeleton" />
            </span>
          ))}
        </div>
      ) : hasItems ? (
        <MobileAssignmentList
          className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3.5"
          assignments={assignments}
          quizzes={courseQuizList}
          courseTitle={course.data?.title ?? ""}
          courseImage={course.data?.avatarUrl}
          courseTone={course.data?.color}
          highlightId={highlightId}
          onOpenAssignment={(item) => setDetailId(item.id)}
          onEditAssignment={(item) => {
            setEditingAssignment(item);
            setDialog(true);
          }}
          onDeleteAssignment={setDeleteTarget}
          onOpenQuiz={setAttemptsOf}
          onEditQuiz={setEditQuizTarget}
        />
      ) : (
        <MobileEmptyCard
          icon="assign"
          title={t("assignments.emptyTitle")}
          description={t("assignments.emptyHint")}
          action={{ label: t("assignments.emptyCreateFirst"), icon: "add", onClick: () => setDialog(true) }}
        />
      )}

      {dialogs}
    </div>
  );
}

interface AttendancePanelProps {
  courseId: string | null;
  lessons?: Lesson[];
  rows?: AttendanceRow[];
  loading: boolean;
}

function AttendancePanel({ courseId, lessons = [], rows = [], loading }: AttendancePanelProps) {
  const { t } = useTranslation("group");
  const isCompact = useIsCompact();
  const [range, setRange] = useState<"all" | "month" | "current">("all");
  const summary = useAttendanceSummary(
    courseId,
    range === "month" ? "30d" : range === "current" ? "month" : "all"
  );

  const lessonDates = useMemo(
    () => new Map(lessons.map((lesson) => [lesson.id, new Date(lesson.startsAt)])),
    [lessons]
  );

  const filtered = useMemo(() => {
    const lessonIds = new Set(lessons.map((lesson) => lesson.id));
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 86_400_000);
    return rows.filter((row) => {
      if (!lessonIds.has(row.lessonId)) return false;
      const date = lessonDates.get(row.lessonId);
      if (!date) return range === "all";
      if (range === "month") return date >= monthAgo;
      if (range === "current")
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      return true;
    });
  }, [rows, lessons, lessonDates, range]);

  const computedLessonCount = new Set(filtered.map((row) => row.lessonId)).size;
  const lessonCount = summary.data?.lessonCount ?? computedLessonCount;

  const computedStudents = useMemo(() => {
    const map = new Map<
      string,
      { name: string; tone?: string; lessons: Set<string>; answered: number; total: number }
    >();
    for (const row of filtered) {
      const current = map.get(row.studentId) ?? {
        name: row.student?.name || row.child,
        tone: row.student?.avatarTone,
        lessons: new Set<string>(),
        answered: 0,
        total: 0,
      };
      current.lessons.add(row.lessonId);
      current.answered += row.attentionAnswered;
      current.total += row.attentionTotal;
      map.set(row.studentId, current);
    }
    return [...map.entries()]
      .map(([id, value]) => ({
        id,
        name: value.name,
        tone: value.tone,
        attendance: lessonCount ? Math.round((value.lessons.size / lessonCount) * 100) : 0,
        focus: value.total ? Math.round((value.answered / value.total) * 100) : null,
      }))
      .sort((a, b) => b.attendance - a.attendance);
  }, [filtered, computedLessonCount]);

  const students = summary.data?.students.length
    ? summary.data.students
        .map((item) => ({
          id: item.id,
          name: item.name,
          tone: undefined as string | undefined,
          attendance: item.attendancePercent,
          focus: item.focusPercent,
        }))
        .sort((a, b) => b.attendance - a.attendance)
    : computedStudents;

  const avgAttendance =
    summary.data?.attendancePercent ??
    (students.length
      ? Math.round(students.reduce((sum, item) => sum + item.attendance, 0) / students.length)
      : 0);
  const focusValues = students
    .map((item) => item.focus)
    .filter((value): value is number => value !== null);
  const avgFocus =
    summary.data?.focusPercent ??
    (focusValues.length
      ? Math.round(focusValues.reduce((sum, value) => sum + value, 0) / focusValues.length)
      : 0);

  const FILTERS = [
    { id: "all" as const, label: isCompact ? t("attendance.filterAllShort") : t("attendance.filterAll") },
    { id: "month" as const, label: isCompact ? t("attendance.filterMonthShort") : t("attendance.filterMonth") },
    { id: "current" as const, label: t("attendance.filterCurrent") },
  ];

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 pt-5 pb-8 lg:gap-3.5 lg:px-7 lg:pt-3.5">
      <PanelHeading eyebrow={t("attendance.eyebrow")} title={t("attendance.title")} className="mb-1 shrink-0" />

      {loading ? (
        <ul className="flex flex-col overflow-hidden rounded-xl bg-surface" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="flex h-[74px] items-center border-b border-line px-4 last:border-b-0">
              <RowSkeleton />
            </li>
          ))}
        </ul>
      ) : students.length ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`flex h-11 items-center justify-center rounded-full text-body-sm font-medium transition-colors ${
                  range === item.id ? "bg-brand text-on-action" : "bg-surface text-ink"
                }`}
                onClick={() => setRange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <section className="flex flex-col gap-3 rounded-xl bg-brand p-4 text-on-action">
            <span className="flex h-6 w-fit items-center gap-1.5 rounded-full bg-on-brand-subtle px-2.5 text-caption-strong">
              <Icon name="bar-chart" size={14} />
              {t("attendance.mobileBadge", { lessonCount, recordCount: filtered.length })}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: `${avgAttendance}%`, label: t("attendance.statAttendance") },
                { value: `${avgFocus}%`, label: t("attendance.statFocus") },
                { value: String(lessonCount), label: t("attendance.statLessons") },
              ].map((tile) => (
                <span key={tile.label} className="flex h-16 flex-col justify-center rounded-xl bg-on-brand-subtle px-3">
                  <strong className="text-title-lg leading-6">{tile.value}</strong>
                  <small className="text-caption">{tile.label}</small>
                </span>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-3">
            <strong className="flex-1 text-body text-ink">{t("attendance.studentsTitle")}</strong>
            <small className="text-body-sm text-brand-strong">{t("attendance.studentsMetaShort")}</small>
          </div>

          <ul className="-mt-1 flex flex-col overflow-hidden rounded-xl bg-surface">
            {students.map((student) => (
              <li key={student.id} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0">
                <Avatar
                  name={student.name}
                  tone={student.tone}
                  size="sm"
                  className="[&_.avatar]:size-11"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <strong className="truncate text-title text-ink">{student.name}</strong>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-subtle">
                      <span
                        className={`block h-full rounded-full ${student.attendance >= 50 ? "bg-brand" : "bg-danger"}`}
                        style={{ width: `${student.attendance}%` }}
                      />
                    </span>
                    <small className="w-8 shrink-0 text-right font-numeric text-caption text-brand">
                      {student.attendance}%
                    </small>
                  </span>
                </span>
                <span className="flex w-12 shrink-0 flex-col items-end">
                  <strong className="font-numeric text-title text-ink">
                    {student.focus === null ? "—" : `${student.focus}%`}
                  </strong>
                  <small className="text-caption text-ink-secondary">{t("attendance.focusSuffix")}</small>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <MobileEmptyCard
          icon="check-circle"
          title={t("attendance.emptyTitle")}
          description={t("attendance.emptyDescription")}
        />
      )}
    </div>
  );
}

