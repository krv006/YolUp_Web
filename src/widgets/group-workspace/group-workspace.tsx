import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  Library,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import { formatDayTime } from "@/shared/lib";
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
import { VoiceRoomBar } from "@/modules/voice";
import { MessageComposer, MessageList } from "@/modules/message";
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
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
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
      <section className="chat-page group-workspace">
      <ChatHeader conversation={hydrated} onToggleInfo={() => setInfoOpen((open) => !open)} />
      <LiveLessonBar courseId={courseId} />
      <VoiceRoomBar courseId={courseId} />
      <nav className="grid shrink-0 grid-cols-4 gap-2 px-4 pt-3 pb-1 lg:px-7 lg:pt-4 lg:pb-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`flex h-9 items-center justify-center rounded-full text-label whitespace-nowrap transition-colors ${
                active
                  ? "bg-brand text-ink-inverse"
                  : "bg-surface text-ink-secondary hover:text-ink"
              }`}
              onClick={() => setParams(tab.id === "chat" ? {} : { tab: tab.id })}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

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

      {activeTab === "chat" ? (
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
    <div className="flex h-full flex-col gap-2 overflow-y-auto bg-canvas p-4 lg:px-7 lg:pt-5 lg:pb-7">
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-overline text-ink-tertiary uppercase">{t("lessons.eyebrow")}</span>
          <h2 className="font-heading text-h1 text-ink">{t("lessons.title")}</h2>
          <p className="text-body-xs text-ink-tertiary">{t("lessons.subtitle")}</p>
        </div>
        <button
          type="button"
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand px-5 text-button whitespace-nowrap text-ink-inverse transition-colors hover:bg-brand-strong"
          onClick={() => {
            setEditing(null);
            setDialog(true);
          }}
        >
          <Icon name="add" size={18} /> {t("lessons.addLesson")}
        </button>
      </div>

      {loading && !lessons.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-37.5 animate-pulse rounded-lg bg-muted" />
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
      <AppDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        variant="confirm"
        title={t("lessons.deleteConfirmTitle", { title: deleteTarget?.title ?? "" })}
        description={t("lessons.deleteDialogDescription", { title: deleteTarget?.title ?? "" })}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setDeleteTarget(null)}
            >
              {t("lessons.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={remove.isPending}
              onClick={() =>
                deleteTarget && remove.mutateAsync(deleteTarget.id).then(() => setDeleteTarget(null))
              }
            >
              {t("lessons.delete")}
            </button>
          </>
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

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto bg-canvas p-4 lg:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-caption-strong tracking-wide text-action uppercase">
            {t("assignments.eyebrow")}
          </span>
          <h2 className="font-heading text-h2 text-ink">{t("assignments.title")}</h2>
          <p className="text-body-sm text-ink-secondary">{t("assignments.subtitle")}</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row-reverse lg:justify-start">
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-action px-5 text-label-strong text-on-action transition-colors hover:bg-action-hover"
            onClick={() => setDialog(true)}
          >
            <Plus size={17} /> {t("assignments.addAssignment")}
          </button>
          <div className="grid grid-cols-2 gap-3 lg:flex">
            <button
              type="button"
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle"
              onClick={() => setBankDialog(true)}
            >
              <Library size={17} /> {t("assignments.fromBank")}
            </button>
            <button
              type="button"
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle"
              onClick={() => setQuizDialog(true)}
            >
              <Pencil size={17} /> {t("assignments.addQuiz")}
            </button>
          </div>
        </div>
      </div>

      {courseQuizList.length ? (
        <div className="flex flex-col gap-3">
          {courseQuizList.map((quiz) => (
            <motion.article
              key={quiz.id}
              data-quiz-id={quiz.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-action text-on-action">
                  <FileQuestion size={20} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <strong className="flex flex-wrap items-center gap-2 text-title text-ink">
                    {quizDisplayTitle(quiz)}
                    <span
                      className={`inline-flex h-6 items-center rounded-full px-2.5 text-caption-strong ${
                        quiz.status === "draft"
                          ? "bg-saffron-subtle text-saffron-strong"
                          : "bg-success-bg text-success-text"
                      }`}
                    >
                      {quiz.status === "draft"
                        ? quizT("teacherPage.draftBadge")
                        : t("assignments.quizBadge")}
                    </span>
                  </strong>
                  <small className="text-body-sm text-ink-tertiary">
                    {quiz.dueAt
                      ? t("assignments.dueLabel", { date: formatDayTime(quiz.dueAt) })
                      : t("assignments.noDue")}{" "}
                    · {t("assignments.quizQuestions", { count: quiz.questionCount })}
                  </small>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-label-strong text-ink transition-colors hover:bg-subtle"
                  onClick={() => setAttemptsOf(quiz)}
                >
                  <BarChart3 size={17} /> {t("assignments.results")}
                </button>
                <button
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-subtle text-ink-secondary transition-colors hover:bg-muted"
                  aria-label={quizT("editDialog.editAria")}
                  title={quizT("editDialog.editAria")}
                  onClick={() => setEditQuizTarget(quiz)}
                >
                  <Pencil size={17} />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      ) : null}

      {loading && !assignments.length ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : assignments.length ? (
        <div className="flex flex-col gap-3">
          {assignments.map((item) => (
            <motion.article
              key={item.id}
              data-assignment-id={item.id}
              className={`flex flex-col gap-3 rounded-2xl border bg-surface p-4 ${
                item.id === highlightId ? "border-action" : "border-line"
              }`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-action text-on-action">
                  <ClipboardList size={20} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <strong className="flex flex-wrap items-center gap-2 text-title text-ink">
                    {item.title}
                    {item.subject ? (
                      <span className="inline-flex h-6 items-center rounded-full bg-subtle px-2.5 text-caption-strong text-ink-secondary">
                        {item.subject}
                      </span>
                    ) : null}
                  </strong>
                  {item.description ? (
                    <p className="line-clamp-2 text-body-sm text-ink-secondary">
                      {item.description}
                    </p>
                  ) : null}
                  <small className="text-body-sm text-ink-tertiary">
                    {item.dueAt
                      ? t("assignments.dueLabel", { date: formatDayTime(item.dueAt) })
                      : t("assignments.noDue")}{" "}
                    · {t("assignments.submissionsCount", { count: item.submissionsCount ?? 0 })}
                  </small>
                  {item.lessonTitle ? (
                    <span className="flex items-center gap-1.5 text-caption text-ink-tertiary">
                      <CalendarDays size={13} /> {item.lessonTitle}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-label-strong text-ink transition-colors hover:bg-subtle"
                  onClick={() => setDetailId(item.id)}
                >
                  <BarChart3 size={17} /> {t("assignments.results")}
                </button>
                <button
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-subtle text-ink-secondary transition-colors hover:bg-muted"
                  onClick={() => {
                    setEditingAssignment(item);
                    setDialog(true);
                  }}
                  aria-label={t("assignments.editAria")}
                  title={t("assignments.editTitle")}
                >
                  <Pencil size={17} />
                </button>
                <button
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-error-bg text-error-text transition-opacity hover:opacity-80"
                  onClick={() => setDeleteTarget(item)}
                  aria-label={t("assignments.deleteAria")}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      ) : courseQuizList.length ? null : (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-action-subtle text-action">
            <ClipboardList size={28} />
          </span>
          <h3 className="font-heading text-h3 text-ink">{t("assignments.emptyTitle")}</h3>
          <button
            type="button"
            className="mt-1 flex h-12 items-center rounded-full bg-action px-5 text-label-strong text-on-action"
            onClick={() => setDialog(true)}
          >
            {t("assignments.emptyCreateFirst")}
          </button>
        </div>
      )}

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

  if (loading)
    return (
      <div className="flex h-full flex-col gap-3 bg-canvas p-4 lg:p-6">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );

  const FILTERS = [
    { id: "all" as const, label: t("attendance.filterAll") },
    { id: "month" as const, label: t("attendance.filterMonth") },
    { id: "current" as const, label: t("attendance.filterCurrent") },
  ];

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto bg-canvas p-4 lg:p-6">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-caption-strong tracking-wide text-action uppercase">
          {t("attendance.eyebrow")}
        </span>
        <h2 className="font-heading text-h2 text-ink">{t("attendance.title")}</h2>
        <p className="text-body-sm text-ink-secondary">
          {t("attendance.summary", { lessonCount, recordCount: filtered.length })}
        </p>
      </div>

      {rows.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex h-11 items-center rounded-full px-4 text-label-strong transition-colors ${
                range === item.id
                  ? "bg-action text-on-action"
                  : "bg-subtle text-ink-secondary hover:bg-muted hover:text-ink"
              }`}
              onClick={() => setRange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {students.length ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: `${avgAttendance}%`, label: t("attendance.statAttendance") },
              { value: `${avgFocus}%`, label: t("attendance.statFocus") },
              { value: String(lessonCount), label: t("attendance.statLessons") },
            ].map((tile) => (
              <div
                key={tile.label}
                className="flex flex-col gap-1 rounded-2xl border border-line bg-surface px-4 py-3"
              >
                <strong className="font-heading text-h2 text-ink">{tile.value}</strong>
                <small className="text-body-sm text-ink-secondary">{tile.label}</small>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-baseline gap-3">
              <strong className="flex-1 text-title text-ink">{t("attendance.studentsTitle")}</strong>
              <small className="text-caption text-ink-tertiary">{t("attendance.studentsMeta")}</small>
            </div>
            <ul className="flex flex-col divide-y divide-line">
              {students.map((student) => (
                <li key={student.id} className="flex items-center gap-3 py-3">
                  <Avatar name={student.name} tone={student.tone} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <strong className="truncate text-label-strong text-ink">{student.name}</strong>
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-subtle">
                        <span
                          className={`block h-full rounded-full ${
                            student.attendance >= 70 ? "bg-success" : "bg-error"
                          }`}
                          style={{ width: `${student.attendance}%` }}
                        />
                      </span>
                      <small
                        className={`font-numeric text-caption ${
                          student.attendance >= 70 ? "text-ink-secondary" : "text-error-text"
                        }`}
                      >
                        {student.attendance}%
                      </small>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end">
                    <strong className="font-numeric text-title text-ink">
                      {student.focus === null ? "—" : `${student.focus}%`}
                    </strong>
                    <small className="text-caption text-ink-tertiary">
                      {t("attendance.focusSuffix")}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-action text-on-action">
            <CheckCircle2 size={30} />
          </span>
          <strong className="font-heading text-h3 text-ink">{t("attendance.emptyTitle")}</strong>
          <p className="max-w-[380px] text-body-sm text-ink-secondary">
            {t("attendance.emptyDescription")}
          </p>
        </div>
      )}
    </div>
  );
}

