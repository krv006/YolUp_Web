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
  TwoFactorChallenge,
} from "./api/auth.dto";
export { AUTH_STATUS, useAuthStore } from "./model/auth.store";
export type { LoginResult } from "./model/auth.store";
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
  useTwoFactorStatus,
  useLoginHistoryPage,
  useAdminCertificates,
  useVerifyCertificate,
  useRejectCertificate,
} from "./model/auth.queries";
export { LoginHistoryDialog } from "./ui/login-history-dialog";
export { TeacherRatingsDialog } from "./ui/teacher-ratings-dialog";
export { describeUserAgent } from "./lib/describe-user-agent";
export { useAuth, useCurrentUser, useIsAuthenticated } from "./model/use-auth";
export { useIsStudent, useRoleRoutes } from "./model/use-role-routes";
export { createLoginSchema, createRegisterSchema } from "./model/auth.schemas";
export {
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useConfirmTwoFactorMutation,
  useDisableTwoFactorMutation,
  useEnableTwoFactorMutation,
  useLogoutOtherSessionsMutation,
  usePasswordResetConfirmMutation,
  usePasswordResetRequestMutation,
  usePasswordResetVerifyMutation,
  useRevokeSessionMutation,
  useRegisterMutation,
  useSwitchAccountMutation,
  useSwitchRoleMutation,
  useDeleteCertificate,
  useUpdateAvatarMutation,
  useUpdateLessonReminderMutation,
  useUpdateNotificationPrefsMutation,
  useUpdateProfileMutation,
  useUploadCertificate,
  useRemoveAvatarMutation,
  useUpdateSettingsMutation,
  useRegisterPhoneCodeMutation,
  useVerifyRegisterPhoneMutation,
  usePhoneChangeCodeMutation,
  useConfirmPhoneChangeMutation,
} from "./model/auth.mutations";
export {
  mapCertificateDto,
  mapLoginRequest,
  mapLoginResponse,
  mapTokenPairDto,
  mapUserDto,
} from "./lib/auth.mappers";
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
  AuthPhoneInput,
  AuthScreen,
} from "./ui/auth-screen";
export { UZ_PHONE_LENGTH, formatUzPhone } from "./lib/uz-phone";
export { MobileLoginForm } from "./ui/mobile-login-form";
export { MobileRegisterForm } from "./ui/mobile-register-form";
export { OtpInput } from "./ui/otp-input";
export { MobileTwoFactorForm, TwoFactorForm } from "./ui/two-factor-form";
export { describeTwoFactorChallenge } from "./lib/describe-two-factor";
export { describeResetError } from "./lib/describe-reset-error";
export { PhoneVerifyDialog } from "./ui/phone-verify-dialog";
export { maskUzPhone, normalizeUzPhone } from "./lib/phone";
