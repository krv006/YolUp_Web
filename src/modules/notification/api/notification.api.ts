import { API_ERROR_CODES, apiClient, AppError, type RequestOptions } from "@/shared/api";
import { notificationEndpoints } from "./notification.endpoints";
import type { PersonSearchDto, PersonSearchResult, SendNotificationInput } from "./notification.dto";
import {
  mapInboxPage,
  mapPersonSearchDto,
  mapRecipientRows,
  mapSendRequest,
  mapSentPage,
} from "../lib/notification.mappers";

function isMissingModule(error: unknown): boolean {
  return (
    error instanceof AppError &&
    (error.status === 404 || error.code === API_ERROR_CODES.NOT_FOUND)
  );
}

export const notificationApi = {
  async getInbox(options: RequestOptions = {}) {
    return mapInboxPage(await apiClient.get(notificationEndpoints.list, options), options.query);
  },

  async getUnreadCount(options?: RequestOptions): Promise<number | null> {
    try {
      const dto = await apiClient.get<{ count?: number }>(
        notificationEndpoints.unreadCount,
        options
      );
      return Number(dto?.count ?? 0);
    } catch (error) {
      if (isMissingModule(error)) return null;
      throw error;
    }
  },

  async markRead(notificationId: string) {
    await apiClient.post(notificationEndpoints.read(notificationId), {});
    return notificationId;
  },

  async remove(notificationId: string) {
    await apiClient.delete(notificationEndpoints.item(notificationId));
  },

  async markUnread(notificationIds: string[]) {
    return apiClient.post<{ updated?: number }>(notificationEndpoints.markUnread, { ids: notificationIds });
  },

  async markAllRead() {
    const response = await apiClient.post<{ updated?: number }>(
      notificationEndpoints.readAll,
      {}
    );
    return response?.updated ?? 0;
  },

  async send(input: SendNotificationInput) {
    return apiClient.post(notificationEndpoints.send, mapSendRequest(input));
  },

  async getSent(options: RequestOptions = {}) {
    return mapSentPage(await apiClient.get(notificationEndpoints.sent, options), options.query);
  },

  async getRecipients(notificationId: string, options?: RequestOptions) {
    return mapRecipientRows(
      await apiClient.get(notificationEndpoints.recipients(notificationId), options)
    );
  },

  async searchUsers(query: string, options?: RequestOptions): Promise<PersonSearchResult[]> {
    const dto = await apiClient.get<PersonSearchDto[]>(notificationEndpoints.searchUsers, {
      ...options,
      query: { q: query },
    });
    return (Array.isArray(dto) ? dto : []).map(mapPersonSearchDto);
  },
};
