import type { UserDto } from "@/shared/types";

export type LinkStatus = "pending" | "approved" | "declined";

export interface ParentLinkDto {
  id: string | number;
  parent?: UserDto;
  student?: UserDto;
  status: LinkStatus;
  created_at: string;
  responded_at?: string | null;
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
