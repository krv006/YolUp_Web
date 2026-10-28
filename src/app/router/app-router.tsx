import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams, type Params } from "react-router-dom";
import { AuthLayout } from "@/app/layouts/auth-layout";
import { AppShellLayout } from "@/app/layouts/app-shell";
import { RootLayout } from "@/app/layouts/root-layout";
import { ProfileIndexRoute, ProfileLayout } from "@/pages/profile/profile-layout";
import { useCurrentUser } from "@/modules/auth";
import { ROLES, type Role } from "@/shared/constants";
import { PageSkeleton } from "@/shared/ui/page-skeleton";
import { SplashScreen } from "@/shared/ui/splash-screen";
import { ProtectedRoute } from "./protected-route";
import { PublicRoute } from "./public-route";
import { RoleRoute } from "./role-route";
import { RouteErrorBoundary } from "./route-error-boundary";
import { ForbiddenPage, NotFoundPage } from "./route-status-pages";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";

const LoginPage = lazy(() =>
  import("@/pages/auth/login-page").then((module) => ({
    default: module.LoginPage,
  }))
);
const RegisterPage = lazy(() =>
  import("@/pages/auth/register-page").then((module) => ({ default: module.RegisterPage }))
);
const WelcomePage = lazy(() =>
  import("@/pages/auth/welcome-page").then((module) => ({ default: module.WelcomePage }))
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/auth/forgot-password-page").then((module) => ({
    default: module.ForgotPasswordPage,
  }))
);
const VerifyCodePage = lazy(() =>
  import("@/pages/auth/verify-code-page").then((module) => ({ default: module.VerifyCodePage }))
);
const NewPasswordPage = lazy(() =>
  import("@/pages/auth/new-password-page").then((module) => ({ default: module.NewPasswordPage }))
);

function WelcomeRoute() {
  const isCompact = useIsCompact();
  if (!isCompact) return <Navigate to={ROUTES.auth.login} replace />;
  return <WelcomePage />;
}

const loadTeacherLayout = () => import("@/app/layouts/teacher-layout");
const loadChatsPage = () => import("@/pages/teacher/chats-page");
const WorkspaceSearchPage = lazy(() =>
  import("@/pages/workspace/workspace-search-page").then((module) => ({
    default: module.WorkspaceSearchPage,
  }))
);
const PersonalInfoPage = lazy(() =>
  import("@/pages/profile/personal-info-page").then((module) => ({
    default: module.PersonalInfoPage,
  }))
);
const AccountSettingsPage = lazy(() =>
  import("@/pages/profile/account-settings-page").then((module) => ({
    default: module.AccountSettingsPage,
  }))
);
const SystemSettingsPage = lazy(() =>
  import("@/pages/profile/system-settings-page").then((module) => ({
    default: module.SystemSettingsPage,
  }))
);
const MyRatingsPage = lazy(() =>
  import("@/pages/profile/my-ratings-page").then((module) => ({ default: module.MyRatingsPage }))
);
const CertificatesPage = lazy(() =>
  import("@/pages/profile/certificates-page").then((module) => ({
    default: module.CertificatesPage,
  }))
);
const LoginHistoryPage = lazy(() =>
  import("@/pages/profile/login-history-page").then((module) => ({
    default: module.LoginHistoryPage,
  }))
);
const HelpCenterPage = lazy(() =>
  import("@/pages/profile/help-center-page").then((module) => ({
    default: module.HelpCenterPage,
  }))
);
const NotificationsPage = lazy(() =>
  import("@/pages/notifications/notifications-page").then((module) => ({
    default: module.NotificationsPage,
  }))
);
const loadConversationPage = () => import("@/pages/teacher/conversation-page");
const loadStudentLayout = () => import("@/app/layouts/student-layout");
const loadStudentConversationPage = () => import("@/pages/student/conversation-page");

const TeacherLayout = lazy(() =>
  loadTeacherLayout().then((module) => ({ default: module.TeacherLayout }))
);
const ChatsPage = lazy(() => loadChatsPage().then((module) => ({ default: module.ChatsPage })));
const ConversationPage = lazy(() =>
  loadConversationPage().then((module) => ({ default: module.ConversationPage }))
);
const StudentLayout = lazy(() =>
  loadStudentLayout().then((module) => ({ default: module.StudentLayout }))
);
const StudentConversationPage = lazy(() =>
  loadStudentConversationPage().then((module) => ({ default: module.StudentConversationPage }))
);
const ParentLayout = lazy(() =>
  import("@/app/layouts/parent-layout").then((module) => ({
    default: module.ParentLayout,
  }))
);
const ParentDashboardPage = lazy(() =>
  import("@/pages/parent/dashboard/parent-dashboard-page").then((module) => ({
    default: module.ParentDashboardPage,
  }))
);
const ParentChildrenPage = lazy(() =>
  import("@/pages/parent/children/parent-children-page").then((module) => ({
    default: module.ParentChildrenPage,
  }))
);
const ParentAttendancePage = lazy(() =>
  import("@/pages/parent/attendance/parent-attendance-page").then((module) => ({
    default: module.ParentAttendancePage,
  }))
);
const ParentHomeworkPage = lazy(() => import("@/pages/parent/homework/parent-homework-page").then((module) => ({ default: module.ParentHomeworkPage })));
const AdminDashboardPage = lazy(() => import("@/pages/admin/admin-dashboard-page").then((module) => ({ default: module.AdminDashboardPage })));
const AdminTeachersPage = lazy(() => import("@/pages/admin/teachers/admin-teachers-page").then((module) => ({ default: module.AdminTeachersPage })));
const LiveLessonPage = lazy(() => import("@/pages/live/live-lesson-page").then((module) => ({ default: module.LiveLessonPage })));
const DesignSystemPage = lazy(() => import("@/pages/design-system/design-system-page").then((module) => ({ default: module.DesignSystemPage })));
const BoardPage = lazy(() => import("@/pages/board/board-page").then((module) => ({ default: module.BoardPage })));
const WorkspaceHomePage = lazy(() => import("@/pages/teacher/workspace/workspace-home-page").then((module) => ({ default: module.WorkspaceHomePage })));
const HomeworkListPage = lazy(() => import("@/pages/teacher/workspace/homework/homework-list-page").then((module) => ({ default: module.HomeworkListPage })));
const HomeworkDetailPage = lazy(() => import("@/pages/teacher/workspace/homework/homework-detail-page").then((module) => ({ default: module.HomeworkDetailPage })));
const HomeworkReviewPage = lazy(() => import("@/pages/teacher/workspace/homework/homework-review-page").then((module) => ({ default: module.HomeworkReviewPage })));
const AiAssistantPage = lazy(() => import("@/pages/teacher/workspace/ai-assistant-page").then((module) => ({ default: module.AiAssistantPage })));
const WorkspaceAnalyticsPage = lazy(() => import("@/pages/teacher/workspace/analytics-page").then((module) => ({ default: module.WorkspaceAnalyticsPage })));
const MockExamsPage = lazy(() => import("@/pages/teacher/workspace/mock-exams-page").then((module) => ({ default: module.MockExamsPage })));
const MockResultsPage = lazy(() => import("@/pages/teacher/workspace/mock-results-page").then((module) => ({ default: module.MockResultsPage })));
const TestResultsPage = lazy(() => import("@/pages/teacher/workspace/test-results-page").then((module) => ({ default: module.TestResultsPage })));
const TestEditorPage = lazy(() => import("@/pages/teacher/workspace/test-editor-page").then((module) => ({ default: module.TestEditorPage })));
const TestDetailsPage = lazy(() => import("@/pages/teacher/workspace/test-details-page").then((module) => ({ default: module.TestDetailsPage })));
const TestsPage = lazy(() => import("@/pages/teacher/workspace/tests-page").then((module) => ({ default: module.TestsPage })));
const TeacherDashboardPage = lazy(() => import("@/pages/teacher/dashboard/teacher-dashboard-page").then((module) => ({ default: module.TeacherDashboardPage })));
const RecordingPage = lazy(() => import("@/pages/recording/recording-page").then((module) => ({ default: module.RecordingPage })));
const SchedulePage = lazy(() => import("@/pages/schedule/schedule-page").then((module) => ({ default: module.SchedulePage })));
const ParentExamsPage = lazy(() => import("@/pages/parent/exams/parent-exams-page").then((module) => ({ default: module.ParentExamsPage })));
const ParentReportPage = lazy(() => import("@/pages/parent/report/parent-report-page").then((module) => ({ default: module.ParentReportPage })));
const StudentWorkspacePage = lazy(() => import("@/pages/student/workspace/student-workspace-page").then((module) => ({ default: module.StudentWorkspacePage })));
const StudentTestsPage = lazy(() => import("@/pages/student/workspace/student-tests-page").then((module) => ({ default: module.StudentTestsPage })));
const StudentTestPage = lazy(() => import("@/pages/student/workspace/student-test-page").then((module) => ({ default: module.StudentTestPage })));
const StudentTestResultsPage = lazy(() => import("@/pages/student/workspace/student-test-results-page").then((module) => ({ default: module.StudentTestResultsPage })));
const StudentAnalyticsPage = lazy(() => import("@/pages/student/workspace/student-analytics-page").then((module) => ({ default: module.StudentAnalyticsPage })));
const StudentMockPage = lazy(() => import("@/pages/student/workspace/student-mock-page").then((module) => ({ default: module.StudentMockPage })));
const StudentMockResultPage = lazy(() => import("@/pages/student/workspace/student-mock-result-page").then((module) => ({ default: module.StudentMockResultPage })));
const StudentHomeworkItemPage = lazy(() => import("@/pages/student/workspace/student-homework-item-page").then((module) => ({ default: module.StudentHomeworkItemPage })));
const StudentHomeworkPage = lazy(() => import("@/pages/student/workspace/student-homework-page").then((module) => ({ default: module.StudentHomeworkPage })));
const StudentHomeworkBoardPage = lazy(() => import("@/pages/student/homework-board/student-homework-board-page").then((module) => ({ default: module.StudentHomeworkBoardPage })));
const StudentExamPage = lazy(() => import("@/pages/student/exams/student-exam-page").then((module) => ({ default: module.StudentExamPage })));
const StudentDashboardPage = lazy(() => import("@/pages/student/dashboard/student-dashboard-page").then((module) => ({ default: module.StudentDashboardPage })));

type ChunkLoader = () => Promise<unknown>;

const PREFETCH_BY_ROLE: Partial<Record<Role, ChunkLoader[]>> = {
  [ROLES.TEACHER]: [loadTeacherLayout, loadChatsPage, loadConversationPage],
  [ROLES.STUDENT]: [loadStudentLayout, loadChatsPage, loadStudentConversationPage],
};

function scheduleIdle(task: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(task, { timeout: 3000 });
    return () => window.cancelIdleCallback?.(handle);
  }
  const handle = window.setTimeout(task, 1500);
  return () => window.clearTimeout(handle);
}

function usePrefetchRoutes(role: Role | undefined) {
  useEffect(() => {
    const loaders = role ? PREFETCH_BY_ROLE[role] : undefined;
    if (!loaders) return undefined;
    return scheduleIdle(() => {
      for (const load of loaders) void load().catch(() => undefined);
    });
  }, [role]);
}

function LegacyRedirect({ to }: { to: (params: Readonly<Params<string>>) => string }) {
  return <Navigate to={to(useParams())} replace />;
}

export function AppRouter() {
  usePrefetchRoutes(useCurrentUser()?.role);

  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <Suspense fallback={<SplashScreen />}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route element={<PublicRoute />}>
                <Route index element={<WelcomeRoute />} />
                <Route element={<AuthLayout />}>
                  <Route path={ROUTES.auth.login} element={<LoginPage />} />
                  <Route path={ROUTES.auth.register} element={<RegisterPage />} />
                  <Route path={ROUTES.auth.forgotPassword} element={<ForgotPasswordPage />} />
                  <Route path={ROUTES.auth.verifyCode} element={<VerifyCodePage />} />
                  <Route path={ROUTES.auth.newPassword} element={<NewPasswordPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/boards/:lessonId" element={<BoardPage />} />
                <Route path="/recordings/:lessonId" element={<RecordingPage />} />

                <Route element={<RoleRoute allowedRoles={[ROLES.TEACHER]} />}>
                  <Route
                    path={ROUTES.teacher.root}
                    element={<Navigate to={ROUTES.teacher.dashboard} replace />}
                  />
                  <Route element={<AppShellLayout />}>
                    <Route path={ROUTES.teacher.dashboard} element={<TeacherDashboardPage />} />
                    <Route path={ROUTES.teacher.notifications} element={<NotificationsPage />} />
                    <Route path={ROUTES.teacher.search} element={<WorkspaceSearchPage />} />
                    <Route path={ROUTES.teacher.schedule} element={<SchedulePage />} />
                    <Route path="/teacher/recordings/:lessonId" element={<RecordingPage />} />
                    <Route path="/teacher/boards/:lessonId" element={<BoardPage />} />
                    <Route path={ROUTES.teacher.workspace} element={<WorkspaceHomePage />} />
                    <Route path={ROUTES.teacher.tests} element={<TestsPage />} />
                    <Route path="/teacher/workspace/tests/:quizId" element={<TestEditorPage />} />
                    <Route path="/teacher/workspace/tests/:quizId/results" element={<TestResultsPage />} />
                    <Route path="/teacher/workspace/tests/:quizId/edit" element={<TestDetailsPage />} />
                    <Route path={ROUTES.teacher.homework} element={<HomeworkListPage />} />
                    <Route path="/teacher/workspace/homework/:assignmentId" element={<HomeworkDetailPage />} />
                    <Route path="/teacher/workspace/homework/:assignmentId/review" element={<HomeworkReviewPage />} />
                    <Route path={ROUTES.teacher.workspaceAi} element={<AiAssistantPage />} />
                    <Route path={ROUTES.teacher.workspaceAnalytics} element={<WorkspaceAnalyticsPage />} />
                    <Route path={ROUTES.teacher.mockExams} element={<MockExamsPage />} />
                    <Route path="/teacher/workspace/mock/:examId" element={<MockResultsPage />} />
                    <Route path={ROUTES.teacher.profile} element={<ProfileLayout />}>
                      <Route index element={<ProfileIndexRoute />} />
                      <Route path="personal" element={<PersonalInfoPage />} />
                      <Route path="account" element={<AccountSettingsPage />} />
                      <Route path="system" element={<SystemSettingsPage />} />
                      <Route path="ratings" element={<MyRatingsPage />} />
                      <Route path="certificates" element={<CertificatesPage />} />
                      <Route path="logins" element={<LoginHistoryPage />} />
                      <Route path="help" element={<HelpCenterPage />} />
                    </Route>
                  </Route>
                  <Route
                    path={ROUTES.teacher.chats}
                    element={
                      <Suspense fallback={<PageSkeleton />}>
                        <TeacherLayout />
                      </Suspense>
                    }
                  >
                    <Route index element={<ChatsPage />} />
                    <Route
                      path="schedule"
                      element={<Navigate to={ROUTES.teacher.schedule} replace />}
                    />
                    <Route
                      path="profile/*"
                      element={<Navigate to={ROUTES.teacher.profile} replace />}
                    />
                    <Route path="search" element={<WorkspaceSearchPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route
                      path="ai"
                      element={<Navigate to={ROUTES.teacher.workspaceAi} replace />}
                    />
                    <Route
                      path="workspace"
                      element={<Navigate to={ROUTES.teacher.workspace} replace />}
                    />
                    <Route
                      path="analytics"
                      element={<Navigate to={ROUTES.teacher.workspaceAnalytics} replace />}
                    />
                    <Route
                      path="quizzes"
                      element={<Navigate to={ROUTES.teacher.tests} replace />}
                    />
                    <Route
                      path="assignments"
                      element={<Navigate to={ROUTES.teacher.homework} replace />}
                    />
                    <Route
                      path="exams"
                      element={<Navigate to={ROUTES.teacher.mockExams} replace />}
                    />
                    <Route
                      path=":conversationId"
                      element={<ConversationPage />}
                    />
                  </Route>
                </Route>

                <Route element={<RoleRoute allowedRoles={[ROLES.STUDENT]} />}>
                  <Route
                    path={ROUTES.student.root}
                    element={<Navigate to={ROUTES.student.dashboard} replace />}
                  />
                  <Route path="/student/courses/*" element={<Navigate to={ROUTES.student.chats} replace />} />
                  <Route path="/student/assignments" element={<Navigate to={ROUTES.student.homework} replace />} />
                  <Route path="/student/grades" element={<Navigate to={ROUTES.student.workspaceAnalytics} replace />} />
                  <Route element={<AppShellLayout />}>
                    <Route path={ROUTES.student.dashboard} element={<StudentDashboardPage />} />
                    <Route path={ROUTES.student.notifications} element={<NotificationsPage />} />
                    <Route path={ROUTES.student.search} element={<WorkspaceSearchPage />} />
                    <Route path={ROUTES.student.schedule} element={<SchedulePage />} />
                    <Route path="/student/recordings/:lessonId" element={<RecordingPage />} />
                    <Route path={ROUTES.student.workspace} element={<StudentWorkspacePage />} />
                    <Route path={ROUTES.student.tests} element={<StudentTestsPage />} />
                    <Route path="/student/workspace/tests/:quizId" element={<StudentTestPage />} />
                    <Route path="/student/workspace/tests/:quizId/results" element={<StudentTestResultsPage />} />
                    <Route path={ROUTES.student.workspaceAnalytics} element={<StudentAnalyticsPage />} />
                    <Route path={ROUTES.student.mockExams} element={<StudentMockPage />} />
                    <Route path="/student/workspace/mock/:examId" element={<StudentMockResultPage />} />
                    <Route path="/student/workspace/mock/:examId/take" element={<StudentExamPage />} />
                    <Route path={ROUTES.student.homework} element={<StudentHomeworkPage />} />
                    <Route path="/student/workspace/homework/:assignmentId" element={<StudentHomeworkItemPage />} />
                    <Route
                      path="/student/workspace/homework/:assignmentId/board"
                      element={<StudentHomeworkBoardPage />}
                    />
                    <Route path={ROUTES.student.profile} element={<ProfileLayout />}>
                      <Route index element={<ProfileIndexRoute />} />
                      <Route path="personal" element={<PersonalInfoPage />} />
                      <Route path="account" element={<AccountSettingsPage />} />
                      <Route path="system" element={<SystemSettingsPage />} />
                      <Route path="ratings" element={<MyRatingsPage />} />
                      <Route path="certificates" element={<CertificatesPage />} />
                      <Route path="logins" element={<LoginHistoryPage />} />
                      <Route path="help" element={<HelpCenterPage />} />
                    </Route>
                  </Route>
                  <Route
                    path={ROUTES.student.chats}
                    element={
                      <Suspense fallback={<PageSkeleton />}>
                        <StudentLayout />
                      </Suspense>
                    }
                  >
                    <Route index element={<ChatsPage />} />
                    <Route path="schedule" element={<Navigate to={ROUTES.student.schedule} replace />} />
                    <Route path="profile/*" element={<LegacyRedirect to={(params) => `${ROUTES.student.profile}/${params["*"] ?? ""}`} />} />
                    <Route path="workspace" element={<Navigate to={ROUTES.student.workspace} replace />} />
                    <Route path="analytics" element={<Navigate to={ROUTES.student.workspaceAnalytics} replace />} />
                    <Route path="quizzes" element={<Navigate to={ROUTES.student.tests} replace />} />
                    <Route path="exams" element={<Navigate to={ROUTES.student.mockExams} replace />} />
                    <Route path="exams/:examId" element={<LegacyRedirect to={(params) => ROUTES.student.mockExam(params.examId ?? "")} />} />
                    <Route
                      path="homework-board/:assignmentId"
                      element={<LegacyRedirect to={(params) => ROUTES.student.homeworkBoard(params.assignmentId ?? "")} />}
                    />
                    <Route path="search" element={<Navigate to={ROUTES.student.search} replace />} />
                    <Route path="notifications" element={<Navigate to={ROUTES.student.notifications} replace />} />
                    <Route
                      path=":conversationId"
                      element={<StudentConversationPage />}
                    />
                  </Route>
                </Route>

                <Route element={<RoleRoute allowedRoles={[ROLES.PARENT]} />}>
                  <Route path={ROUTES.parent.root} element={<ParentLayout />}>
                    <Route
                      index
                      element={
                        <Navigate to={ROUTES.parent.dashboard} replace />
                      }
                    />
                    <Route path="dashboard" element={<ParentDashboardPage />} />
                    <Route path="children" element={<ParentChildrenPage />} />
                    <Route
                      path="attendance"
                      element={<ParentAttendancePage />}
                    />
                    <Route path="homework" element={<ParentHomeworkPage />} />
                    <Route path="exams" element={<ParentExamsPage />} />
                    <Route path="grades" element={<ParentReportPage />} />
                  </Route>
                </Route>

                <Route path="/live/:lessonId" element={<LiveLessonPage />} />

                <Route
                  element={
                    <RoleRoute
                      allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
                    />
                  }
                >
                  <Route
                    path={ROUTES.admin.root}
                    element={<Navigate to={ROUTES.admin.dashboard} replace />}
                  />
                  <Route
                    path={ROUTES.admin.dashboard}
                    element={<AdminDashboardPage />}
                  />
                  <Route
                    path={ROUTES.admin.teachers}
                    element={<AdminTeachersPage />}
                  />
                </Route>
              </Route>

              <Route
                path={ROUTES.designSystem}
                element={<DesignSystemPage />}
              />
              <Route
                path={ROUTES.errors.forbidden}
                element={<ForbiddenPage />}
              />
              <Route path={ROUTES.errors.notFound} element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}
