import { describe, expect, it } from "vitest";
import * as analytics from "@/modules/analytics/lib/analytics.mappers";
import * as attendance from "@/modules/attendance/lib/attendance.mappers";
import * as auth from "@/modules/auth/lib/auth.mappers";
import * as board from "@/modules/board/lib/board.mappers";
import * as conversation from "@/modules/conversation/lib/conversation.mappers";
import * as course from "@/modules/course/lib/course.mappers";
import * as exam from "@/modules/exam/lib/exam.mappers";
import * as homework from "@/modules/homework/lib/homework.mappers";
import * as lesson from "@/modules/lesson/lib/lesson.mappers";
import * as live from "@/modules/live/lib/live.mappers";
import * as message from "@/modules/message/lib/message.mappers";
import * as notification from "@/modules/notification/lib/notification.mappers";
import * as parent from "@/modules/parent/lib/parent.mappers";
import * as quiz from "@/modules/quiz/lib/quiz.mappers";
import * as tutor from "@/modules/tutor/lib/tutor.mappers";
import * as voice from "@/modules/voice/lib/voice.mappers";

type Mapper = (dto: never, ...rest: never[]) => unknown;

const RESPONSE_MAPPERS: Record<string, Mapper> = {
  ...pick(analytics, ["mapTopCourseDto", "mapTopTeacherDto", "mapDashboardSummaryDto", "mapDashboardTrendsDto", "mapMyAnalytics", "mapTeacherVideoStats", "mapMonitoringSample", "mapMonitoringHistory"]),
  ...pick(attendance, ["mapAttendanceDto", "mapAttendancePage", "mapAttendanceSummary"]),
  ...pick(auth, ["mapLoginRecordsPage", "mapLoginRecords", "mapTeacherRatings", "mapTeacherStats"]),
  ...pick(board, ["mapSignalsDto", "mapBoardDto", "mapPeriodicElementDto"]),
  ...pick(conversation, ["mapConversationDto", "mapConversationPage", "mapTeacherDto"]),
  ...pick(course, ["mapCourseDto", "mapCourseUserDto", "mapEnrollmentDto", "mapCoursePage"]),
  ...pick(exam, ["mapExamTemplateItemDto", "mapExamTemplateDto", "mapExamSectionDto", "mapExamSummaryDto", "mapExamDetailDto", "mapExamCurrentDto", "mapExamStudentResultDto", "mapExamResultsDto", "mapExamStudentResultDetailDto"]),
  ...pick(homework, ["mapAiResultDto", "mapSubmissionDto", "mapBoardDto", "mapAssignmentDto", "mapHomeworkReportDto"]),
  ...pick(lesson, ["mapLessonDto", "mapLessonPage", "mapLessonRecordingDto", "mapLessonRatingDto", "mapLessonRatingList"]),
  ...pick(live, ["mapRoomTokenDto", "mapAttentionDto", "mapFocusDto"]),
  ...pick(message, ["mapMessageDto", "mapPinnedDto", "mapChatMemberDto"]),
  ...pick(notification, ["mapInboxNotificationDto", "mapInboxPage", "mapSentNotificationDto", "mapSentPage"]),
  ...pick(parent, ["mapParentLinkDto"]),
  ...pick(quiz, ["mapQuizOptionDto", "mapQuizQuestionDto", "mapQuizSummaryDto", "mapQuizGroupDto", "mapQuizDto", "mapQuizAttemptAnswerDto", "mapQuizAttemptSummaryDto", "mapQuizQuestionStatDto", "mapQuizAttemptResultDto", "mapQuizImportPreviewDto"]),
  ...pick(tutor, ["mapPracticeSet", "mapAiExplanation"]),
  ...pick(voice, ["mapVoiceRoomDto", "mapVoiceJoinRequestDto", "mapVoiceTokenDto"]),
};

function pick<T extends object>(module: T, names: string[]): Record<string, Mapper> {
  return Object.fromEntries(
    names.map((name) => {
      const fn = (module as Record<string, unknown>)[name];
      if (typeof fn !== "function") throw new Error(`${name} topilmadi`);
      return [name, fn as Mapper];
    })
  );
}

const INPUTS: Array<[string, unknown]> = [
  ["an empty object", {}],
  ["an object with only an id", { id: 1 }],
  ["an empty page", { count: 0, next: null, previous: null, results: [] }],
];

describe("response mappers survive missing fields", () => {
  for (const [name, mapper] of Object.entries(RESPONSE_MAPPERS)) {
    for (const [label, input] of INPUTS) {
      it(`${name} with ${label}`, () => {
        expect(() => mapper(structuredClone(input) as never)).not.toThrow();
      });
    }
  }
});

describe("list mappers survive a missing list", () => {
  it.each([
    ["mapImportWarningDtos", quiz.mapImportWarningDtos as Mapper],
    ["mapRecipientRows", notification.mapRecipientRows as Mapper],
  ])("%s", (_name, mapper) => {
    expect(() => mapper(undefined as never)).not.toThrow();
    expect(() => mapper([] as never)).not.toThrow();
  });
});

describe("auth mappers validate the token and certificate contract strictly", () => {
  it("rejects a response without tokens", () => {
    expect(() => auth.mapTokenPairDto({})).toThrow();
    expect(() => auth.mapLoginResponse({})).toThrow();
    expect(() => auth.mapSwitchAccountResponse({})).toThrow();
  });

  it("accepts a minimal valid response", () => {
    expect(auth.mapTokenPairDto({ access: "a", refresh: "r" })).toEqual({ accessToken: "a", refreshToken: "r" });
    expect(auth.mapCertificateDto({ id: "c1", file: "/media/c1.pdf", created_at: "2026-10-29T10:00:00Z" })).toMatchObject({
      id: "c1",
      title: "",
      issuer: "",
      issuedYear: null,
    });
  });
});

