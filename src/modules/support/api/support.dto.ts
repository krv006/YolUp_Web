export type SupportTicketStatus = "open" | "answered" | "closed";

export interface SupportMessageDto {
  id: string | number;
  body?: string | null;
  from_staff?: boolean | null;
  author?: string | null;
  created_at?: string | null;
}

export interface SupportTicketDto {
  id: string | number;
  subject?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message?: string | null;
  user?: { id: string | number; name?: string | null } | null;
  messages?: SupportMessageDto[] | null;
}

export interface HelpVideoDto {
  id: string | number;
  title?: string | null;
  url?: string | null;
  duration_seconds?: number | null;
}

export interface FaqItemDto {
  id: string | number;
  question?: string | null;
  answer?: string | null;
}

export interface SupportMessage {
  id: string;
  body: string;
  fromStaff: boolean;
  author: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  messages: SupportMessage[];
}

export interface HelpVideo {
  id: string;
  title: string;
  url: string;
  durationSeconds: number | null;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}
