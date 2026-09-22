import { useEffect, useRef, useState } from "react";
import { formatDayTime } from "@/shared/lib";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FileQuestion,
  FileUp,
  History,
  ListChecks,
  Paperclip,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ChatHeader } from "@/modules/conversation";
import { VoiceRoomBar } from "@/modules/voice";
import { useCourse } from "@/modules/course";
import { MessageComposer, MessageList } from "@/modules/message";
import {
  HomeworkResultDialog,
  useAssignments,
  useDownloadAssignmentFile,
  useSubmission,
  useSubmitHomework,
} from "@/modules/homework";
import {
  LessonCalendar,
  LessonList,
  LessonViewSwitch,
  LiveLessonBar,
  RateLessonDialog,
  useLessons,
  useLessonView,
} from "@/modules/lesson";
import { QuizAttemptDialog, QuizAttemptsDialog, useQuizzes, quizDisplayTitle } from "@/modules/quiz";
import type {
  Assignment,
  ChatMessage,
  Conversation,
  Lesson,
  QuizSummary,
  SendMessagePayload,
  Submission,
} from "@/shared/types";
import type { ChatController } from "@/modules/message";
import { ROUTES } from "@/shared/config";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";

type TabId = "chat" | "lessons" | "assignments";

function useTabs(): Array<{ id: TabId; label: string; icon: typeof BookOpen }> {
  const { t } = useTranslation("student");
  return [
    { id: "chat", label: t("groupWorkspace.tabs.chat"), icon: BookOpen },
    { id: "lessons", label: t("groupWorkspace.tabs.lessons"), icon: CalendarDays },
    { id: "assignments", label: t("groupWorkspace.tabs.assignments"), icon: ListChecks },
  ];
}

const SPEAKING_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.docx,.mp3,.wav,.m4a,.ogg";
const DEFAULT_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.docx";

function isAssignmentOverdue(assignment: Assignment): boolean {
  if (!assignment.dueAt || assignment.mySubmission) return false;
  const deadline = Date.parse(assignment.dueAt);
  return Number.isFinite(deadline) && deadline < Date.now();
}

export interface StudentGroupWorkspaceProps {
  conversation: Conversation;
  messages: ChatController["messages"];
  sendMessage: ChatController["sendMessage"];
  sendTyping: () => void;
  retryMessage: (message: ChatMessage) => void;
  currentUserId?: string;
}

export function StudentGroupWorkspace({
  conversation,
  messages,
  sendMessage,
  sendTyping,
  retryMessage,
  currentUserId,
}: StudentGroupWorkspaceProps) {
  const { t } = useTranslation("student");
  const TABS = useTabs();
  const [params, setParams] = useSearchParams();
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const courseId = conversation.courseId;

  const tabParam = params.get("tab") as TabId | null;
  const active: TabId = TABS.some((item) => item.id === tabParam) ? (tabParam as TabId) : "chat";

  const lessons = useLessons({ course: courseId, page_size: 100 }, active === "lessons");
  const assignments = useAssignments(courseId, active === "assignments");
  const quizzes = useQuizzes(courseId, active === "assignments" && Boolean(courseId));

  const course = useCourse(courseId);

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
      await sendMessage.mutateAsync({
        ...payload,
        replyTo: reply ? { author: reply.senderName || t("groupWorkspace.replyFallback"), text: reply.text } : undefined,
      });
      setReply(null);
    } catch {
      toast.error(t("groupWorkspace.sendFailed"));
    }
  }

  return (
    <section className="chat-page group-workspace student-group-workspace">
      <ChatHeader conversation={hydrated} backTo="/student/chats" />
      <LiveLessonBar courseId={courseId} />
      <VoiceRoomBar courseId={courseId} />
      <nav className="group-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={active === tab.id ? "is-active" : ""}
              onClick={() => setParams(tab.id === "chat" ? {} : { tab: tab.id })}
            >
              {active === tab.id ? (
                <motion.span layoutId="student-group-tab" className="group-tab-indicator" />
              ) : null}
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          className="group-tab-content"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
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
              onEdit={() => undefined}
              onDelete={() => undefined}
              onReact={() => undefined}
              capabilities={{ reply: true, edit: false, delete: false, react: false }}
            />
          ) : null}
          {active === "lessons" ? (
            <StudentLessons
              lessons={lessons.data}
              loading={lessons.isLoading}
              currentUserId={currentUserId}
            />
          ) : null}
          {active === "assignments" ? (
            <StudentAssignments
              assignments={assignments.data}
              loading={assignments.isLoading}
              quizzes={(quizzes.data ?? []).filter((quiz) => quiz.courseId === courseId)}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {active === "chat" ? (
        <MessageComposer
          onSend={send}
          onTyping={sendTyping}
          sending={sendMessage.isPending}
          replyTo={reply}
          currentUserId={currentUserId}
          onCancelContext={() => setReply(null)}
        />
      ) : null}
    </section>
  );
}

function StudentLessons({
  lessons = [],
  loading,
  currentUserId,
}: {
  lessons?: Lesson[];
  loading: boolean;
  currentUserId?: string;
}) {
  const { t } = useTranslation("student");
  const navigate = useNavigate();
  const [rateTarget, setRateTarget] = useState<Lesson | null>(null);
  const { view, setView } = useLessonView();

  const actions = {
    onJoin: (lesson: Lesson) => navigate(ROUTES.live(lesson.id)),
    onRecording: (lesson: Lesson) => navigate(ROUTES.recording(lesson.id)),
    onRate: setRateTarget,
  };

  return (
    <div className="group-panel student-readonly-panel">
      <div className="group-panel-head">
        <div>
          <span>{t("groupWorkspace.lessons.eyebrow")}</span>
          <h2>{t("groupWorkspace.lessons.title")}</h2>
        </div>
        <div className="group-panel-tools">
          <LessonViewSwitch view={view} onChange={setView} />
        </div>
      </div>

      {loading ? (
        <div className="student-tab-loading">
          <span />
        </div>
      ) : view === "calendar" ? (
        <LessonCalendar lessons={lessons} {...actions} />
      ) : (
        <LessonList lessons={lessons} {...actions} />
      )}

      <RateLessonDialog
        lesson={rateTarget}
        currentUserId={currentUserId}
        onOpenChange={(open) => {
          if (!open) setRateTarget(null);
        }}
      />
    </div>
  );
}

function AttachmentButton({ assignment }: { assignment: Assignment }) {
  const { t } = useTranslation("student");
  const download = useDownloadAssignmentFile();
  if (!assignment.hasAttachment) return null;
  return (
    <button
      className="icon-button"
      aria-label={t("groupWorkspace.assignments.downloadAria")}
      disabled={download.isPending}
      onClick={() =>
        download.mutate({ id: assignment.id, fileName: assignment.attachmentName || assignment.title })
      }
    >
      <Paperclip size={16} />
    </button>
  );
}

function AttachmentDownloadRow({ assignment }: { assignment: Assignment }) {
  const { t } = useTranslation("student");
  const download = useDownloadAssignmentFile();
  return (
    <Button
      variant="secondary"
      loading={download.isPending}
      onClick={() =>
        download.mutate({ id: assignment.id, fileName: assignment.attachmentName || assignment.title })
      }
    >
      <Paperclip size={16} /> {assignment.attachmentName || t("groupWorkspace.assignments.downloadFallback")}
    </Button>
  );
}

function SubmissionStatus({
  initial,
  onOpen,
}: {
  initial: Submission;
  onOpen: (submission: Submission) => void;
}) {
  const { t } = useTranslation("student");
  const submission = useSubmission(initial.id, { poll: initial.status === "checking" });
  const data = submission.data ?? initial;
  const tone =
    data.status === "done" ? "" : data.status === "error" ? " grade-pill--error" : " grade-pill--checking";
  const label =
    data.status === "done" ? (
      <>
        <CheckCircle2 size={15} /> {data.overallScore} {t("groupWorkspace.assignments.scoreSuffix")}
      </>
    ) : data.status === "error" ? (
      t("groupWorkspace.assignments.checkError")
    ) : (
      t("groupWorkspace.assignments.checking")
    );

  return (
    <button
      className={`grade-pill grade-pill--button${tone}`}
      onClick={() => onOpen(data)}
      aria-label={t("groupWorkspace.assignments.openResultAria")}
    >
      {label}
    </button>
  );
}

function useAssignmentHighlight(assignmentId: string | null, ready: boolean) {
  useEffect(() => {
    if (!assignmentId || !ready) return;
    document
      .querySelector(`[data-assignment-id="${CSS.escape(assignmentId)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [assignmentId, ready]);
}

function StudentAssignments({
  assignments = [],
  loading,
  quizzes = [],
}: {
  assignments?: Assignment[];
  loading: boolean;
  quizzes?: QuizSummary[];
}) {
  const { t } = useTranslation("student");
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [attemptOf, setAttemptOf] = useState<QuizSummary | null>(null);
  const [historyOf, setHistoryOf] = useState<QuizSummary | null>(null);
  const [params] = useSearchParams();
  const highlightId = params.get("assignment");
  useAssignmentHighlight(highlightId, assignments.length > 0);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [resultOf, setResultOf] = useState<Submission | null>(null);
  const submit = useSubmitHomework();

  if (loading)
    return (
      <div className="student-tab-loading">
        <span />
      </div>
    );

  return (
    <div className="group-panel student-readonly-panel">
      <div className="group-panel-head">
        <div>
          <span>{t("groupWorkspace.assignments.eyebrow")}</span>
          <h2>{t("groupWorkspace.assignments.title")}</h2>
        </div>
      </div>
      <div className="student-workspace-list">
        {quizzes.map((quiz) => (
          <article key={quiz.id} data-quiz-id={quiz.id}>
            <span className="workspace-list-icon">
              <FileQuestion size={20} />
            </span>
            <div>
              <strong>{quizDisplayTitle(quiz)}</strong>
              <p>
                {t("groupWorkspace.assignments.quizBadge")} ·{" "}
                {quiz.dueAt
                  ? `${t("groupWorkspace.assignments.dueLabel")}: ${formatDayTime(quiz.dueAt)}`
                  : t("groupWorkspace.assignments.noDue")}{" "}
                · {t("groupWorkspace.assignments.quizQuestions", { count: quiz.questionCount })}
              </p>
            </div>
            <button
              className="icon-button"
              aria-label={t("groupWorkspace.assignments.quizHistoryAria")}
              onClick={() => setHistoryOf(quiz)}
            >
              <History size={16} />
            </button>
            <Button size="sm" onClick={() => setAttemptOf(quiz)}>
              {t("groupWorkspace.assignments.quizSolve")}
            </Button>
          </article>
        ))}
        {assignments.map((item) => {
          const overdue = isAssignmentOverdue(item);
          const deadlineLabel = item.dueAt
            ? formatDayTime(item.dueAt)
            : null;

          return (
            <article
              key={item.id}
              data-assignment-id={item.id}
              className={`${item.id === highlightId ? "is-highlighted " : ""}${overdue ? "is-overdue" : ""}`.trim()}
            >
              <span className="workspace-list-icon">
                <ListChecks size={20} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p className={overdue ? "is-overdue" : ""}>
                  {deadlineLabel
                    ? `${overdue ? t("groupWorkspace.assignments.overdueLabel") : t("groupWorkspace.assignments.dueLabel")}: ${deadlineLabel}`
                    : t("groupWorkspace.assignments.noDue")}
                </p>
              </div>
              <AttachmentButton assignment={item} />
              {item.mySubmission ? (
                <SubmissionStatus initial={item.mySubmission} onOpen={setResultOf} />
              ) : overdue ? (
                <span className="assignment-missed-pill" role="status">
                  <CircleAlert size={15} /> {t("groupWorkspace.assignments.missed")}
                </span>
              ) : (
                <Button size="sm" onClick={() => setSelected(item)}>
                  {t("groupWorkspace.assignments.submit")}
                </Button>
              )}
            </article>
          );
        })}
        {!assignments.length && !quizzes.length ? (
          <p className="portal-muted">{t("groupWorkspace.assignments.empty")}</p>
        ) : null}
      </div>

      <QuizAttemptDialog
        quizId={attemptOf?.id ?? null}
        open={Boolean(attemptOf)}
        onOpenChange={(open) => {
          if (!open) setAttemptOf(null);
        }}
      />
      <QuizAttemptsDialog
        quizId={historyOf?.id ?? null}
        open={Boolean(historyOf)}
        onOpenChange={(open) => {
          if (!open) setHistoryOf(null);
        }}
        title={historyOf?.title}
      />

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setFile(null);
          }
        }}
      >
        {selected ? (
          <DialogContent title={selected.title} description={t("groupWorkspace.assignments.submitDialogDescription")}>
            <div className="homework-submit-dialog">
              <p>{selected.description}</p>
              {selected.hasAttachment ? <AttachmentDownloadRow assignment={selected} /> : null}
              <div className="assignment-upload-row">
                <input
                  ref={fileRef}
                  type="file"
                  accept={selected.skillKey === "speaking" ? SPEAKING_ACCEPT : DEFAULT_ACCEPT}
                  hidden
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <button type="button" onClick={() => fileRef.current?.click()}>
                  <FileUp size={16} /> {t("groupWorkspace.assignments.chooseFile")}
                </button>
                {file ? (
                  <span>
                    <Paperclip size={14} /> {file.name}
                  </span>
                ) : null}
              </div>
              <Button
                loading={submit.isPending}
                disabled={!file || isAssignmentOverdue(selected)}
                onClick={() => {
                  if (isAssignmentOverdue(selected)) {
                    toast.error(t("groupWorkspace.assignments.deadlinePassed"));
                    setSelected(null);
                    return;
                  }
                  void submit
                    .mutateAsync({ assignmentId: selected.id, file, skillKey: selected.skillKey })
                    .then(() => setSelected(null))
                    .catch(() => undefined);
                }}
              >
                {t("groupWorkspace.assignments.send")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <HomeworkResultDialog
        submissionId={resultOf?.id}
        initial={resultOf}
        open={Boolean(resultOf)}
        onOpenChange={(open: boolean) => {
          if (!open) setResultOf(null);
        }}
        canDownloadFile
        title={t("groupWorkspace.assignments.resultDialogTitle")}
      />
    </div>
  );
}

