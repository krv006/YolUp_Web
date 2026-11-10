export const parentEndpoints = Object.freeze({
  childSummary: (studentId: string) => `/api/v1/analytics/child/${studentId}/summary/`,
  childRank: (studentId: string) => `/api/v1/analytics/child/${studentId}/rank/`,
  childScores: (studentId: string) => `/api/v1/analytics/child/${studentId}/scores/`,
  childrenSummary: "/api/v1/analytics/children/summary/",
});
