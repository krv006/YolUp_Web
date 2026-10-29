export const materialEndpoints = Object.freeze({
  list: "/api/v1/materials/",
  detail: (id: string) => `/api/v1/materials/${id}/`,
  file: (id: string) => `/api/v1/materials/${id}/file/`,
});
