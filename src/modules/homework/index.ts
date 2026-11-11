export { homeworkApi } from "./api/homework.api";
export type {
  AiResultDto,
  AssignmentDto,
  AssignmentFormInput,
  HomeworkAnswerInput,
  HomeworkCourseReportDto,
  HomeworkQuestionInput,
  HomeworkReportDto,
  SubmissionDto,
  SubmissionReviewInput,
  ResubmitRequestInput,
} from "./api/homework.dto";
export { HOMEWORK_EXTENSIONS, HOMEWORK_MAX_FILE_SIZE, HOMEWORK_SKILLS } from "./constants/homework.constants";
export { defaultMaxScore, mapAiResultDto, mapAssignmentDto, mapAssignmentRequest, mapHomeworkReportDto, mapSubmissionDto } from "./lib/homework.mappers";
export { validateHomeworkFile } from "./lib/homework-validation";
export { submissionAiState } from "./lib/submission-ai-state";
export {
  draftsFromQuestions,
  isTestQuestion,
  questionIssue,
  toQuestionInputs,
  totalPoints,
} from "./lib/homework-questions";
export type { DraftQuestion } from "./lib/homework-questions";
export { QuestionsEditor } from "./ui/questions-editor";
export { useQuestionDrafts } from "./model/use-question-drafts";
export { QuestionsAnswerForm } from "./ui/questions-answer-form";
export { answerInputs, isAnswered } from "./lib/homework-answers";
export type { AnswerDraft } from "./lib/homework-answers";
export { QuestionsResult } from "./ui/questions-result";
export { useHomeworkBoardSource } from "./model/use-homework-board";
export type { HomeworkBoardSaveState } from "./model/use-homework-board";
export { getHomeworkPollingInterval, homeworkKeys, useAssignmentAiSummary, useHomeworkAiStats, useRemindAssignment, useRequestResubmit, useAssignment, useAssignments, useSubmission, useCreateAssignment, useDeleteAssignment, useDownloadAssignmentFile, useHomeworkBoard, useHomeworkDraft, useSaveHomeworkDraft, useSaveHomeworkBoard, useSubmitHomeworkBoard, useDownloadSubmissionFile, useHomeworkReport, useRecheckSubmission, useReviewSubmission, useSubmitHomework, useUpdateAssignment } from "./model/homework.queries";
export { AssignmentDetailDialog } from "./ui/assignment-detail-dialog";
export { HomeworkChatCard } from "./ui/homework-chat-card";
export { HomeworkMessageCard } from "./ui/homework-message-card";
export { homeworkFieldError } from "./lib/homework-errors";
export { HomeworkResultDialog } from "./ui/homework-result-dialog";
export { HomeworkReportView } from "./ui/homework-report-view";
