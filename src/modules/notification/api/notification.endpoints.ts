export const notificationEndpoints = Object.freeze({
  list: "/api/v1/notifications/",
  send: "/api/v1/notifications/send/",
  read: (notificationId: string) => `/api/v1/notifications/${notificationId}/read/`,
  readAll: "/api/v1/notifications/read-all/",
  unreadCount: "/api/v1/notifications/unread-count/",
  sent: "/api/v1/notifications/sent/",
  recipients: (id: string) => `/api/v1/notifications/${id}/recipients/`,
  searchUsers: "/api/v1/auth/users/search/",
  pushVapidKey: "/api/v1/notifications/push/vapid-key/",
  pushSubscribe: "/api/v1/notifications/push/subscribe/",
  pushUnsubscribe: "/api/v1/notifications/push/unsubscribe/",
});
