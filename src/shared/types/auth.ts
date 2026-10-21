import type { AppError } from "@/shared/api";
import type { Role } from "@/shared/constants";

export interface Certificate {
  id: string;
  file: string;
  title: string;
  createdAt: string;
}

export interface LinkedAccount {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  role: Role;
  phone: string | null;
  inviteCode: string | null;
  avatarUrl: string | null;
  email: string | null;
  status: string;
  avgRating: number | null;
  ratingCount: number | null;
  isApproved: boolean | null;
  certificates: Certificate[];
  preferredLanguage: string;
  lessonReminderMinutes: number | null;
  notifyMessages: boolean;
  notifyEmail: boolean;
  linkedAccounts: LinkedAccount[];
  middleName: string | null;
  birthDate: string | null;
  subject: string | null;
  city: string | null;
  bio: string | null;
  experienceYears: number | null;
  parentPhone: string | null;
  passwordChangedAt: string | null;
}

export interface TeacherRating {
  id: string;
  lessonId: string;
  studentName: string;
  studentUsername: string;
  stars: number;
  description: string;
  createdAt: string;
}

export interface TeacherStats {
  avgRating: number | null;
  ratingCount: number;
  ratingBreakdown: Record<string, number>;
  courseCount: number;
  studentCount: number;
  lessonsFinished: number;
  lessonsCancelled: number;
  lessonsScheduled: number;
  reliability: number | null;
}

export type AuthStatus = "anonymous" | "initializing" | "authenticated" | "error";

export interface LoginCredentials {
  login: string;
  password: string;
  remember?: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isInitializing: boolean;
  initializationError: AppError | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  retrySession: () => void;
}
