export const messageEndpoints = Object.freeze({
  history: (roomId: string) => `/api/v1/chat/rooms/${roomId}/messages/`,
  search: (roomId: string) => `/api/v1/chat/rooms/${roomId}/messages/search/`,
  send: (roomId: string) => `/api/v1/chat/rooms/${roomId}/send/`,
  voice: (roomId: string) => `/api/v1/chat/rooms/${roomId}/voice/`,
  read: (roomId: string) => `/api/v1/chat/rooms/${roomId}/read/`,
  members: (roomId: string) => `/api/v1/chat/rooms/${roomId}/members/`,
  pinned: (roomId: string) => `/api/v1/chat/rooms/${roomId}/pinned/`,
  pinnedItem: (roomId: string, messageId: string) =>
    `/api/v1/chat/rooms/${roomId}/pinned/${messageId}/`,
  message: (messageId: string) => `/api/v1/chat/messages/${messageId}/`,
  bulkDelete: "/api/v1/chat/messages/bulk-delete/",
  forward: "/api/v1/chat/messages/forward/",
  reactions: (messageId: string) => `/api/v1/chat/messages/${messageId}/reactions/`,
  file: (messageId: string) => `/api/v1/chat/files/${messageId}/`,
});
