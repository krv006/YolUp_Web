export const conversationEndpoints = Object.freeze({
  rooms: "/api/v1/chat/rooms/", detail: (id: string) => `/api/v1/chat/rooms/${id}/`,
  teachers: "/api/v1/chat/rooms/teachers/", directRequest: "/api/v1/chat/rooms/direct/request/",
  directRespond: "/api/v1/chat/rooms/direct/respond/",
  directOpen: "/api/v1/chat/rooms/direct/open/",
  report: (id: string) => `/api/v1/chat/rooms/${id}/report/`,
  roomImage: (id: string) => `/api/v1/chat/rooms/${id}/image/`,
  pinRoom: (id: string) => `/api/v1/chat/rooms/${id}/pin-room/`,
  mute: (id: string) => `/api/v1/chat/rooms/${id}/mute/`,
  read: (id: string) => `/api/v1/chat/rooms/${id}/read/`,
  leave: (id: string) => `/api/v1/chat/rooms/${id}/leave/`,
});
