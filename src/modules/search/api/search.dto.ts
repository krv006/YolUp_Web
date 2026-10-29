export type SearchType = "groups" | "lessons" | "quizzes" | "messages" | "people";

export interface SearchHitDto {
  type: SearchType;
  id: string | number;
  title?: string | null;
  subtitle?: string | null;
  starts_at?: string | null;
  status?: string | null;
  room_id?: string | number | null;
  message_id?: string | number | null;
  sender?: string | null;
  created_at?: string | null;
  role?: string | null;
  avatar?: string | null;
}

export interface SearchResponseDto {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: SearchHitDto[];
  counts?: Partial<Record<SearchType, number>>;
}

export interface SearchHit {
  type: SearchType;
  id: string;
  title: string;
  subtitle: string;
  startsAt: string | null;
  status: string | null;
  roomId: string | null;
  messageId: string | null;
  sender: string;
  createdAt: string | null;
  role: string | null;
  avatarUrl: string | null;
}

export interface SearchResults {
  items: SearchHit[];
  counts: Partial<Record<SearchType, number>>;
}
