export type SupportTicketStatus = "open" | "answered" | "closed";

export interface SupportAttachmentDto {
  id: string | number;
  name?: string | null;
  size?: number | null;
  mime?: string | null;
  url?: string | null;
}

export interface SupportMessageDto {
  id: string | number;
  body?: string | null;
  from_staff?: boolean | null;
  author?: string | null;
  created_at?: string | null;
  attachments?: SupportAttachmentDto[] | null;
}

export interface SupportRatingDto {
  stars?: number | null;
  tags?: string[] | null;
  comment?: string | null;
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
  number?: number | string | null;
  category?: string | null;
  queue_position?: number | null;
  queue_minutes?: number | null;
  unread?: boolean | null;
  rating?: SupportRatingDto | null;
}

export interface HelpConfigDto {
  online?: boolean | null;
  reply_minutes?: number | null;
  hours?: string | null;
  telegram?: string | null;
  telegram_url?: string | null;
  phone?: string | null;
  attachments?: { max_mb?: number | null; max_files?: number | null } | null;
}

export interface HelpConfig {
  online: boolean | null;
  replyMinutes: number | null;
  hours: string;
  telegram: string;
  telegramUrl: string;
  phone: string;
  attachmentsMaxMb: number;
  attachmentsMaxFiles: number;
}

export interface SupportAttachment {
  id: string;
  name: string;
  size: number | null;
  mime: string;
  url: string;
}

export interface SupportRating {
  stars: number;
  tags: string[];
  comment: string;
}

export interface TicketDraft {
  category: string;
  subject: string;
  message: string;
  deviceInfo: string | null;
  files: File[];
}

export interface ArticleFeedback {
  article: string;
  helpful: boolean;
  reason?: string;
  comment?: string;
  language: string;
}

export interface HelpVideoDto {
  id: string | number;
  title?: string | null;
  url?: string | null;
  duration_seconds?: number | null;
  description?: string | null;
  category?: string | null;
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
  attachments: SupportAttachment[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  messages: SupportMessage[];
  number: string | null;
  category: string | null;
  queuePosition: number | null;
  queueMinutes: number | null;
  unread: boolean | null;
  rateable: boolean;
  rating: SupportRating | null;
}

export interface HelpVideo {
  id: string;
  title: string;
  url: string;
  durationSeconds: number | null;
  description: string;
  category: string | null;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}
