function segment(value: string | number): string {
  return encodeURIComponent(String(value));
}

export const ROUTES = Object.freeze({
  root: "/",
  auth: Object.freeze({
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
  }),
  teacher: Object.freeze({
    root: "/teacher",
    dashboard: "/teacher/dashboard",
    chats: "/teacher/chats",
    chat: (conversationId: string) => `/teacher/chats/${segment(conversationId)}`,
    courses: "/teacher/courses",
    course: (courseId: string) => `/teacher/courses/${segment(courseId)}`,
    courseLessons: (courseId: string) => `/teacher/courses/${segment(courseId)}/lessons`,
    attendance: "/teacher/attendance",
    schedule: "/teacher/schedule",
    profile: "/teacher/profile",
    settings: "/teacher/settings",
  }),
  student: Object.freeze({
    root: "/student",
    dashboard: "/student/dashboard",
    courses: "/student/courses",
    course: (courseId: string) => `/student/courses/${segment(courseId)}`,
    assignments: "/student/assignments",
    grades: "/student/grades",
    schedule: "/student/schedule",
    chats: "/student/chats",
  }),
  parent: Object.freeze({
    root: "/parent",
    dashboard: "/parent/dashboard",
    children: "/parent/children",
    child: (childId: string) => `/parent/children/${segment(childId)}`,
    attendance: "/parent/attendance",
    homework: "/parent/homework",
    exams: "/parent/exams",
    grades: "/parent/grades",
    payments: "/parent/payments",
    chats: "/parent/chats",
  }),
  admin: Object.freeze({
    root: "/admin",
    dashboard: "/admin/dashboard",
    users: "/admin/users",
    teachers: "/admin/teachers",
    courses: "/admin/courses",
    payments: "/admin/payments",
    reports: "/admin/reports",
  }),
  live: (lessonId: string) => `/live/${segment(lessonId)}`,
  board: (lessonId: string) => `/boards/${segment(lessonId)}`,
  recording: (lessonId: string) => `/recordings/${segment(lessonId)}`,
  errors: Object.freeze({
    forbidden: "/forbidden",
    notFound: "/not-found",
  }),
  designSystem: "/design-system",
});
