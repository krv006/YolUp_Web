import { apiClient } from "@/shared/api";
import type { Club, DomainUser, UserDto } from "@/shared/types";
import type { ClubDto } from "./course.dto";
import { mapClubDto, mapCourseUserDto } from "../lib/course.mappers";

export interface ClubAudience {
  courseIds: string[];
  studentIds: string[];
}

export interface ClubInput extends ClubAudience {
  title: string;
  description: string;
}

const ENDPOINTS = Object.freeze({
  clubs: "/api/v1/clubs/",
  club: (id: string) => `/api/v1/clubs/${id}/`,
  members: (id: string) => `/api/v1/clubs/${id}/members/`,
  member: (id: string, studentId: string) => `/api/v1/clubs/${id}/members/${studentId}/`,
});

function audience({ courseIds, studentIds }: ClubAudience) {
  return {
    ...(courseIds.length ? { course_ids: courseIds } : {}),
    ...(studentIds.length ? { student_ids: studentIds } : {}),
  };
}

function toList<T>(value: T[] | { results?: T[] } | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  return value?.results ?? [];
}

export const clubApi = {
  async list(options?: { signal?: AbortSignal }): Promise<Club[]> {
    return toList(await apiClient.get<ClubDto[] | { results?: ClubDto[] }>(ENDPOINTS.clubs, options)).map(mapClubDto);
  },
  async create(input: ClubInput): Promise<Club> {
    return mapClubDto(
      await apiClient.post<ClubDto>(ENDPOINTS.clubs, {
        title: input.title.trim(),
        description: input.description.trim(),
        ...audience(input),
      })
    );
  },
  async members(id: string, options?: { signal?: AbortSignal }): Promise<DomainUser[]> {
    return toList(await apiClient.get<UserDto[] | { results?: UserDto[] }>(ENDPOINTS.members(id), options)).map(
      mapCourseUserDto
    );
  },
  async addMembers(id: string, input: ClubAudience) {
    const dto = await apiClient.post<{ added?: number }>(ENDPOINTS.members(id), audience(input));
    return Number(dto?.added ?? 0);
  },
  async removeMember(id: string, studentId: string) {
    await apiClient.delete(ENDPOINTS.member(id, studentId));
  },
};
