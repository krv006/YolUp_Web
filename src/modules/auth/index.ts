export { authApi } from "./api/auth.api";
export { authEndpoints } from "./api/auth.endpoints";
export type {
  AuthUserDto,
  CertificateDto,
  ConsentRequestDto,
  CreateChildRequestDto,
  LinkAction,
  LoginRecord,
  LoginRecordDto,
  ProfileFormValues,
  RegisterFormValues,
  TokenPair,
  TokenPairDto,
} from "./api/auth.dto";
export { AUTH_STATUS, useAuthStore } from "./model/auth.store";
export {
  authKeys,
  useApproveTeacher,
  useLoginHistory,
  useMyRatings,
  useMyStats,
  useSessions,
  usePendingTeachers,
  useTeacherRatings,
  useTeacherStats,
  useTeachers,
} from "./model/auth.queries";
export { LoginHistoryDialog } from "./ui/login-history-dialog";
export { TeacherRatingsDialog } from "./ui/teacher-ratings-dialog";
export { describeUserAgent } from "./lib/describe-user-agent";
export { useAuth, useCurrentUser, useIsAuthenticated } from "./model/use-auth";
export { createLoginSchema, createRegisterSchema } from "./model/auth.schemas";
export {
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useLogoutOtherSessionsMutation,
  useRevokeSessionMutation,
  useRegisterMutation,
  useSwitchAccountMutation,
  useSwitchRoleMutation,
  useDeleteCertificate,
  useUpdateAvatarMutation,
  useUpdateLessonReminderMutation,
  useUpdateProfileMutation,
  useUploadCertificate,
} from "./model/auth.mutations";
export { mapCertificateDto, mapLoginRequest, mapTokenPairDto, mapUserDto } from "./lib/auth.mappers";
export { resolveHomeRoute } from "./lib/resolve-home-route";
export { describeCreateError } from "./lib/teacher-approval";
export { LoginForm } from "./ui/login-form";
export { RegisterForm } from "./ui/register-form";
export {
  AuthButton,
  AuthField,
  AuthFieldError,
  AuthPasswordField,
  AuthPhoneField,
  AuthScreen,
} from "./ui/auth-screen";
export { MobileLoginForm } from "./ui/mobile-login-form";
export { MobileRegisterForm } from "./ui/mobile-register-form";
export { OtpInput } from "./ui/otp-input";
