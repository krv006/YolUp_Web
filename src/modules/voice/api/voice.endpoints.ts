export const voiceEndpoints = Object.freeze({
  list: "/api/v1/voice-rooms/",
  detail: (id: string) => `/api/v1/voice-rooms/${id}/`,
  join: (id: string) => `/api/v1/voice-rooms/${id}/join/`,
  leave: (id: string) => `/api/v1/voice-rooms/${id}/leave/`,
  close: (id: string) => `/api/v1/voice-rooms/${id}/close/`,
  requestJoin: (id: string) => `/api/v1/voice-rooms/${id}/request-join/`,
  requests: (id: string) => `/api/v1/voice-rooms/${id}/requests/`,
  approve: (id: string, requestId: string) => `/api/v1/voice-rooms/${id}/requests/${requestId}/approve/`,
  deny: (id: string, requestId: string) => `/api/v1/voice-rooms/${id}/requests/${requestId}/deny/`,
});
