
export interface UserDto {
  id: string | number;
  username: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone?: string | null;
  invite_code?: string | null;
  avatar?: string | null;
}

export interface PaginatedDto<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
