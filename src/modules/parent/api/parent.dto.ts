import type { UserDto } from "@/shared/types";

export type LinkStatus = "pending" | "approved" | "declined";

export interface ParentLinkDto {
  id: string | number;
  parent?: UserDto;
  student?: UserDto;
  status: LinkStatus;
  created_at: string;
  responded_at?: string | null;
  grade?: string | null;
  courses_count?: number | null;
  last_seen_at?: string | null;
  is_online?: boolean | null;
  expires_at?: string | null;
  reminded_at?: string | null;
}

export interface ChildSummaryDto {
  student_id: string;
  attendance: { month_percent: number | null; attended: number; total: number; delta_percent: number | null };
  score: { average: number | null; scale: number; delta: number | null };
  homework: { total: number; submitted: number; due_soon: number };
  week_minutes: number;
  score_trend: Array<{ week_start: string; average: number | null }>;
}

export interface ChildRankDto {
  student_id: string;
  course_id: string;
  month: string;
  rank: number | null;
  total: number;
  top_percent: number | null;
  percentile: number | null;
  delta: number | null;
}

export interface ChildrenSummaryDto {
  student_id: string;
  groups_count: number;
  restricted: boolean;
  attendance: { month_percent: number | null; period_percent: number | null; attended_total: number } | null;
  last_visit: { lesson_id: string; course_title: string; lesson_title: string; joined_at: string } | null;
  homework: { period_submitted: number; period_total: number };
  score: { average: number | null; period_average: number | null; scale: number };
}

export interface ChildSessionDto {
  id: string;
  device: string;
  browser: string;
  os: string;
  device_type: "phone" | "tablet" | "computer";
  ip: string | null;
  city: string | null;
  created_at: string;
  last_active: string;
  active: boolean;
  revoked_at: string | null;
}

export interface UsernameAvailability {
  username: string;
  valid: boolean;
  available: boolean;
  suggestions: string[];
}

export type ConsentKind = "recording" | "camera" | "analytics";

export interface ConsentDto {
  id: string | number;
  student: string | number;
  kind: ConsentKind;
  granted: boolean;
  updated_at: string;
}

export interface ParentLinkPerson {
  id: string;
  name: string;
  username: string;
  phone?: string | null;
  inviteCode?: string | null;
  avatarUrl?: string | null;
}

export interface ParentLink {
  id: string;
  parentId: string;
  studentId: string;
  status: LinkStatus;
  createdAt: string;
  respondedAt: string | null;
  grade: string;
  coursesCount: number | null;
  lastSeenAt: string | null;
  isOnline: boolean;
  expiresAt: string | null;
  remindedAt: string | null;
  parent: ParentLinkPerson;
  student: ParentLinkPerson;
}

export interface ParentChild {
  id: string;
  linkId: string;
  name: string;
  username: string;
  grade: string;
  lessons: number;
  minutes: number;
  lastActivity: string;
  status: string;
  avatarTone: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  coursesCount: number | null;
}

export interface ParentMetric {
  id: string;
  label: string;
  value: string;
  icon: string;
}

export interface ParentDashboard {
  metrics: ParentMetric[];
}

export interface Consent {
  id: string;
  studentId: string;
  kind: ConsentKind;
  granted: boolean;
  updatedAt: string;
}

export interface SetConsentInput {
  studentId: string;
  kind: ConsentKind;
  granted: boolean;
}
