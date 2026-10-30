import { describe, expect, it } from "vitest";
import { API_ERROR_CODES, AppError, createTransportError } from "./api-error";
import { handleApiResponse } from "./response-interceptor";

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

async function failure(response: Response): Promise<AppError> {
  try {
    await handleApiResponse(response, { requestId: "local-id" });
  } catch (error) {
    return error as AppError;
  }
  throw new Error("expected the response to fail");
}

describe("handleApiResponse", () => {
  it("unwraps the success envelope and passes plain payloads through", async () => {
    expect(await handleApiResponse(json({ success: true, data: { id: 1 } }))).toEqual({ id: 1 });
    expect(await handleApiResponse(json([1, 2]))).toEqual([1, 2]);
    expect(await handleApiResponse(new Response(null, { status: 204 }))).toBeNull();
  });

  it("reads the backend error envelope", async () => {
    const error = await failure(
      json(
        { success: false, error: { code: "permission_denied", message: "Chat hali ochiq emas", details: { detail: "Chat hali ochiq emas" } } },
        403,
        { "x-request-id": "srv-id" }
      )
    );
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: "permission_denied", status: 403, message: "Chat hali ochiq emas", requestId: "srv-id" });
  });

  it("collects field errors for forms from the envelope details", async () => {
    const error = await failure(
      json({ success: false, error: { code: "invalid", message: "Bu login band.", details: { username: ["Bu login band."], detail: "x" } } }, 400)
    );
    expect(error.code).toBe("invalid");
    expect(error.message).toBe("Bu login band.");
    expect(error.fields).toEqual({ username: ["Bu login band."] });
    expect(error.requestId).toBe("local-id");
  });

  it("falls back to the status code for an unwrapped validation error", async () => {
    expect((await failure(json({ detail: "x" }, 400))).code).toBe(API_ERROR_CODES.VALIDATION_ERROR);
  });

  it("maps HTTP status codes when the body has no code", async () => {
    expect((await failure(json({}, 404))).code).toBe(API_ERROR_CODES.NOT_FOUND);
    expect((await failure(json({}, 429))).code).toBe(API_ERROR_CODES.RATE_LIMITED);
    expect((await failure(new Response("Bad gateway", { status: 502 }))).code).toBe(API_ERROR_CODES.SERVER_ERROR);
  });

  it("treats a 200 with success:false as an error", async () => {
    expect((await failure(json({ success: false, error: { code: "quota" } }))).code).toBe("quota");
  });
});

describe("createTransportError", () => {
  it("tells timeout, abort, offline and network errors apart", () => {
    expect(createTransportError(null, { timedOut: true }).code).toBe(API_ERROR_CODES.TIMEOUT);
    expect(createTransportError(null, { aborted: true }).code).toBe(API_ERROR_CODES.REQUEST_ABORTED);
    expect(createTransportError(null, { offline: true }).code).toBe(API_ERROR_CODES.OFFLINE);
    expect(createTransportError(new TypeError("Failed to fetch")).code).toBe(API_ERROR_CODES.NETWORK_ERROR);
  });
});
