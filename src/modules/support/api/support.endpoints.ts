export const supportEndpoints = Object.freeze({
  tickets: "/api/v1/support/tickets/",
  ticket: (id: string) => `/api/v1/support/tickets/${id}/`,
  reply: (id: string) => `/api/v1/support/tickets/${id}/reply/`,
  close: (id: string) => `/api/v1/support/tickets/${id}/close/`,
  rate: (id: string) => `/api/v1/support/tickets/${id}/rate/`,
  config: "/api/v1/help/config/",
  feedback: "/api/v1/help/feedback/",
  videos: "/api/v1/help/videos/",
  faq: "/api/v1/help/faq/",
});
