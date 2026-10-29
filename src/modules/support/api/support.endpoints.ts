export const supportEndpoints = Object.freeze({
  tickets: "/api/v1/support/tickets/",
  ticket: (id: string) => `/api/v1/support/tickets/${id}/`,
  reply: (id: string) => `/api/v1/support/tickets/${id}/reply/`,
  close: (id: string) => `/api/v1/support/tickets/${id}/close/`,
  videos: "/api/v1/help/videos/",
  faq: "/api/v1/help/faq/",
});
