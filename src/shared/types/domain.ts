import type { TeacherStats } from "./auth";

export type AvatarTone = "violet" | "blue" | "emerald" | "amber" | "rose";

export type ConversationRole = "teacher" | "student";

export interface DomainUser {
  id: string;
  username: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string | null;
  inviteCode?: string | null;
  avatarTone?: string;
  status?: string;
}

export type DirectStatus = "pending" | "active" | "blocked";

export interface ConversationParticipant {
  id: string;
  username: string;
  name: string;
  phone: string | null;
}

export type PresenceStatus = "online" | "offline";

export interface Conversation {
  id: string;
  type: "group" | "direct";
  kind: "course" | "direct";
  courseId: string | null;
  title: string;
  participantId: string | null;
  participant: ConversationParticipant | null;
  directStatus: DirectStatus | null;
  lastMessage: string;
  lastSender: string | null;
  updatedAt: string;
  unreadCount: number;
  status: PresenceStatus;
  typing: boolean;
  typingName?: string | null;
  avatarTone: string;
  memberCount: number;
  imageUrl: string | null;
  subject?: string;
  subjectLabel?: string;
  description?: string;
}

export interface MessageReply {
  author: string;
  text: string;
}

export interface SendMessagePayload {
  text: string;
  replyTo?: MessageReply;
  attachment?: unknown;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface MessageAttachment {
  messageId: string;
  name: string;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderRole?: string;
  text: string;
  replyTo?: MessageReply;
  type: string;
  createdAt: string;
  status: string;
  pending: boolean;
  failed: boolean;
  editedAt?: string | null;
  retryPayload?: SendMessagePayload;
  attachment?: MessageAttachment;
  reactions?: MessageReaction[];
}

export interface Course {
  id: string;
  title: string;
  subject: string;
  subjectLabel: string;
  description: string;
  teacher: string;
  teacherUser: DomainUser | null;
  students: number;
  studentCount: number;
  status: string;
  enrollmentStatus: string | null;
  isActive: boolean;
  isLanguageSubject: boolean;
  createdAt: string | null;
  color: string;
}

export type EnrollmentStatus = "pending" | "approved" | "declined";

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  student: DomainUser;
  status: EnrollmentStatus;
  createdAt: string;
}

export interface CourseStudentSearchResult extends DomainUser {
  enrollStatus: EnrollmentStatus | null;
}

export type LessonStatus = "scheduled" | "live" | "finished" | "cancelled";

export type LessonRecordingStatus = "recording" | "merging" | "completed" | "failed";

export interface LessonRecording {
  status: LessonRecordingStatus;
  ready: boolean;
  title: string;
  streamUrl: string | null;
  createdAt: string | null;
  endedAt: string | null;
  error: string | null;
}

export interface Lesson {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  topic: string;
  startsAt: string;
  durationMinutes: number;
  duration: number;
  status: LessonStatus;
  roomName: string;
  createdAt: string;
  date: string;
  time: string;
  avgRating: number | null;
  ratingCount: number;
  quizId: string | null;
}

export interface LessonRating {
  id: string;
  lessonId: string;
  stars: number;
  description: string;
  studentId: string | null;
  studentName: string;
  createdAt: string;
}

export interface LessonFormValues {
  topic: string;
  date: string;
  time: string;
  duration: number;
}

export type SubmissionStatus = "checking" | "done" | "error";

export interface AiQuestion {
  questionNumber?: number;
  question?: string;
  studentAnswer?: string;
  expectedSolution?: string;
  analysis?: string;
  mistakes?: unknown[];
  errorCategories?: unknown[];
  correctAnswer?: string;
  suggestions?: unknown[];
  difficulty?: string;
  score?: number | null;
}

export interface AiSummary {
  strengths: unknown[];
  weaknesses: unknown[];
  topicsToReview: unknown[];
  recommendations: unknown[];
}

export interface AiResult {
  overallScore: number | null;
  grade: string;
  questions: AiQuestion[];
  summary: AiSummary | null;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  fileName: string;
  status: SubmissionStatus;
  overallScore: number | null;
  grade: string;
  error: string;
  isLate: boolean;
  createdAt: string;
  checkedAt: string | null;
  result: AiResult | null;
  rawResult: Record<string, unknown> | null;
}

export interface AssignmentStats {
  studentsCount: number | null;
  submittedCount: number | null;
  averageScore: number | null;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle: string;
  subject: string;
  title: string;
  description: string;
  body: string;
  attachmentName: string;
  hasAttachment: boolean;
  dueAt: string | null;
  skillKey: string;
  lessonId: string | null;
  lessonTitle: string;
  createdAt: string;
  submissionsCount: number | null;
  mySubmission: Submission | null;
  submissions: Submission[];
  stats: AssignmentStats | null;
}

export interface AssignmentFormValues {
  title: string;
  description: string;
  body?: string;
  dueAt?: string;
  skillKey?: string;
  extraInstructions?: string;
  file?: File | null;
}

export interface HomeworkReportSummary {
  assignedCount: number;
  submittedCount: number;
  submissionRate: number;
  averageScore: number | null;
}

export type QuizQuestionType =
  | "single"
  | "multiple"
  | "true_false"
  | "numeric"
  | "text"
  | "matching"
  | "ordering"
  | "fill_blank";

export type VoiceAccessMode = "open" | "invite_only";
export type VoiceRoomStatus = "scheduled" | "live" | "ended";
export type VoiceJoinRequestStatus = "pending" | "approved" | "denied";

export interface VoiceRoom {
  id: string;
  courseId: string;
  createdById: string;
  createdByName: string;
  title: string;
  accessMode: VoiceAccessMode;
  status: VoiceRoomStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  participantCount: number;
  createdAt: string;
}

export interface VoiceJoinRequest {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  status: VoiceJoinRequestStatus;
  createdAt: string;
}

export interface VoiceToken {
  token: string;
  serverUrl: string;
  roomName: string;
  isModerator: boolean;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizChoiceItem {
  id: string;
  text: string;
}

export interface QuizAnswerKey {
  correctBool?: boolean;
  acceptedAnswers?: string[];
  tolerance?: number;
  caseSensitive?: boolean;
  pairs?: Array<{ left: string; right: string }>;
  items?: string[];
  blanks?: Array<{ answers: string[] }>;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  text: string;
  points: number;
  order: number;
  options: QuizOption[];
  matchLeft: QuizChoiceItem[];
  matchRight: QuizChoiceItem[];
  blankCount: number;
  answerKey?: QuizAnswerKey;
}

export type QuizAnswerValue =
  | { type: "single"; optionId: string | null }
  | { type: "multiple"; optionIds: string[] }
  | { type: "true_false"; value: boolean | null }
  | { type: "numeric"; value: string }
  | { type: "text"; value: string }
  | { type: "matching"; pairs: Record<string, string> }
  | { type: "ordering"; order: string[] }
  | { type: "fill_blank"; values: string[] };

export type QuizStatus = "draft" | "published";

export interface QuizSummary {
  id: string;
  courseId: string;
  subject: string;
  subjectLabel: string;
  lessonId: string | null;
  title: string;
  topic: string;
  status: QuizStatus;
  description: string;
  dueAt: string | null;
  opensAt: string | null;
  createdAt: string;
  questionCount: number;
}

export interface QuizDetail extends QuizSummary {
  questions: QuizQuestion[];
}

export interface QuizAttemptAnswer {
  questionId: string;
  questionText: string;
  questionType: QuizQuestionType;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  isCorrect: boolean;
  correctOption: { id: string; text: string } | null;
  points: number | null;
  earnedPoints: number | null;
  givenDisplay: string | null;
  correctDisplay: string | null;
}

export interface QuizAttemptSummary {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  createdAt: string;
}

export interface QuizAttemptResult extends QuizAttemptSummary {
  answers: QuizAttemptAnswer[];
}

export interface QuizQuestionFormValues {
  type: QuizQuestionType;
  text: string;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
  correctBool?: boolean;
  acceptedAnswers?: string[];
  tolerance?: number;
  caseSensitive?: boolean;
  pairs?: Array<{ left: string; right: string }>;
  items?: string[];
  blanks?: Array<{ answers: string[] }>;
}

export interface QuizEditValues {
  topic?: string;
  title?: string;
  description?: string;
  dueAt?: string | null;
  opensAt?: string | null;
  questions?: QuizQuestionFormValues[];
}

export interface QuizFormValues {
  courseId: string;
  subject?: string;
  topic: string;
  status?: QuizStatus;
  lessonId?: string | null;
  title: string;
  description?: string;
  dueAt?: string | null;
  opensAt?: string | null;
  questions: QuizQuestionFormValues[];
}

export interface TopCourseStat {
  id: string;
  title: string;
  teacherName: string;
  studentCount: number;
  avgRating: number | null;
  attendanceRate: number | null;
}

export interface TopTeacherStat {
  id: string;
  name: string;
  courseCount: number;
  lessonsThisMonth: number;
  avgRating: number | null;
  reliability: number | null;
}

export interface DashboardSummary {
  activeStudents: number;
  activeTeachers: number;
  activeCourses: number;
  avgRating: number | null;
  ratingCount: number;
  totalVideos: number;
  topCourses: TopCourseStat[];
  topTeachers: TopTeacherStat[];
}

export type DashboardPeriod = "day" | "week" | "month" | "year";

export interface DashboardTrends {
  period: DashboardPeriod;
  labels: string[];
  enrollments: number[];
  lessonsCompleted: number[];
  lessonsCancelled: number[];
  quizAvgScore: Array<number | null>;
  attendanceRate: Array<number | null>;
}

export interface QuizImportWarning {
  questionNumber: number;
  reason: string;
}

export interface QuizImportPreview {
  title: string;
  description: string;
  questions: QuizQuestionFormValues[];
  warnings: QuizImportWarning[];
}

export interface CourseHomeworkReport extends HomeworkReportSummary {
  courseId: string;
  courseTitle: string;
}

export interface HomeworkReport {
  courses: CourseHomeworkReport[];
  overall: HomeworkReportSummary;
}


export interface FocusExit {
  leftAt: string;
  returnedAt: string | null;
  seconds: number;
}

export interface FocusJournal {
  exits: number;
  awaySeconds: number;
  longestSeconds: number;
  timeline: FocusExit[];
  alert: boolean;
}

export interface AttendanceRow {
  id: string;
  lessonId: string;
  lesson: string;
  studentId: string;
  student: DomainUser;
  child: string;
  joinedAt: string | null;
  leftAt: string | null;
  entered: string;
  exited: string;
  minutes: number;
  duration: string;
  attentionTotal: number;
  attentionAnswered: number;
  focus: FocusJournal;
  status: "completed" | "active";
}

export interface StudentAttemptSummary {
  quizId: string;
  quizTitle: string;
  courseTitle: string;
  score: number;
  maxScore: number;
  percentage: number | null;
  takenAt: string;
}

export interface StudentAnalytics {
  kind: "student";
  attemptCount: number;
  avgPercentage: number | null;
  recentAttempts: StudentAttemptSummary[];
}

export interface TeacherCourseAnalytics {
  courseId: string;
  courseTitle: string;
  studentCount: number | null;
  avgRating: number | null;
  reliability: number | null;
  quizAvgPercentage: number | null;
  quizAttemptCount: number | null;
  attendanceRate: number | null;
}

export interface TeacherAnalytics {
  kind: "teacher";
  overall: TeacherStats;
  courses: TeacherCourseAnalytics[];
}

export type MyAnalytics = StudentAnalytics | TeacherAnalytics;

export interface TeacherVideoStat {
  teacherId: string;
  teacherName: string;
  videoCount: number;
}

export interface TeacherVideoStats {
  totalVideos: number;
  teachers: TeacherVideoStat[];
}

export interface MonitoringSample {
  cpuPercent: number;
  memoryPercent: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  createdAt: string;
}

export interface MonitoringHistory {
  hours: number;
  samples: MonitoringSample[];
  peak: MonitoringSample | null;
}
