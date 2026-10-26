import type { UserDto } from "@/shared/types";

export interface FocusExitDto {
  left_at: string;
  returned_at: string | null;
  seconds: number;
}

export interface FocusJournalDto {
  exits?: number;
  away_seconds?: number;
  longest_seconds?: number;
  timeline?: FocusExitDto[];
}

export interface AttendanceDto {
  id: string | number;
  lesson: string | number;
  lesson_title: string;
  student: UserDto;
  joined_at: string | null;
  left_at: string | null;
  minutes: number;
  attention_total: number;
  attention_answered: number;
  focus_exits: number;
  focus_percent?: number | null;
  focus?: FocusJournalDto | null;
  focus_alert?: boolean | null;
}
