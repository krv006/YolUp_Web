import { AppError, API_ERROR_CODES, apiClient, type RequestOptions } from "@/shared/api";
import { courseApi, type CourseFormInput } from "@/modules/course";
import type { Conversation } from "@/shared/types";
import { conversationEndpoints } from "./conversation.endpoints";
import type { ChatRoomDto, DirectAction, DirectTeacherDto } from "./conversation.dto";
import { mapConversationDto, mapConversationPage, mapTeacherDto } from "../lib/conversation.mappers";

export const conversationApi = {
  async getAll(options: RequestOptions = {}) {
    return mapConversationPage(
      await apiClient.get(conversationEndpoints.rooms, {
        ...options,
        query: { page_size: 100, ...options.query },
      }),
      options.query
    );
  },
  async getById(id: string, options?: RequestOptions) {
    return mapConversationDto(await apiClient.get<ChatRoomDto>(conversationEndpoints.detail(id), options));
  },
  async createGroup(payload: CourseFormInput): Promise<Conversation> {
    const course = await courseApi.create(payload);
    const rooms = await this.getAll();
    const room = rooms.items.find((item) => item.courseId === course.id);
    if (!room) {
      throw new AppError({
        code: API_ERROR_CODES.NOT_FOUND,
        message: "Kurs yaratildi, chat xonasi hali tayyor emas",
      });
    }
    return room;
  },
  async setRoomImage(roomId: string, image: File): Promise<Conversation> {
    const body = new FormData();
    body.set("image", image);
    return mapConversationDto(
      await apiClient.post<ChatRoomDto>(conversationEndpoints.roomImage(roomId), body)
    );
  },
  async getTeachers(options?: RequestOptions) {
    const items = await apiClient.get<DirectTeacherDto[]>(conversationEndpoints.teachers, options);
    return items.map(mapTeacherDto);
  },
  async requestDirect(teacher: string) {
    return mapConversationDto(
      await apiClient.post<ChatRoomDto>(conversationEndpoints.directRequest, { teacher })
    );
  },
  async setPinned(roomId: string, pinned: boolean): Promise<Conversation> {
    const url = conversationEndpoints.pinRoom(roomId);
    return mapConversationDto(
      pinned
        ? await apiClient.post<ChatRoomDto>(url, {})
        : await apiClient.delete<ChatRoomDto>(url)
    );
  },
  async setMuted(roomId: string, muted: boolean, until: string | null = null): Promise<Conversation> {
    const url = conversationEndpoints.mute(roomId);
    return mapConversationDto(
      muted
        ? await apiClient.post<ChatRoomDto>(url, { until })
        : await apiClient.delete<ChatRoomDto>(url)
    );
  },
  async setAnnouncementOnly(roomId: string, announcementOnly: boolean): Promise<Conversation> {
    return mapConversationDto(
      await apiClient.patch<ChatRoomDto>(conversationEndpoints.detail(roomId), {
        announcement_only: announcementOnly,
      })
    );
  },
  async leave(roomId: string): Promise<void> {
    await apiClient.delete(conversationEndpoints.leave(roomId));
  },
  async respondDirect(roomId: string, action: DirectAction) {
    return mapConversationDto(
      await apiClient.post<ChatRoomDto>(conversationEndpoints.directRespond, { room_id: roomId, action })
    );
  },
  async createDirect(): Promise<never> {
    throw new AppError({
      code: API_ERROR_CODES.FORBIDDEN,
      message: "Shaxsiy chat so‘rovini o‘quvchi yuboradi",
    });
  },
};
