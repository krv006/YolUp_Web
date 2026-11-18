import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/api";
import { useEmailCode, type UseEmailCodeOptions } from "./use-email-code";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
let options: UseEmailCodeOptions;

function Probe() {
  const flow = useEmailCode(options);
  return (
    <div>
      <output data-stage={flow.stage} data-invalid={String(flow.invalid)} data-error={flow.error ?? ""} data-retry={flow.retryIn} data-to={flow.sentTo} />
      <button type="button" data-send onClick={() => void flow.send(" Ali@Example.com ")} />
      <input data-code value={flow.code} onChange={(event) => flow.setCode(event.target.value)} />
    </div>
  );
}

const out = () => host.querySelector("output") as HTMLOutputElement;

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function typeCode(value: string) {
  const input = host.querySelector("input") as HTMLInputElement;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await flush();
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  options = {
    request: vi.fn().mockResolvedValue({ expiresIn: 120, retryAfter: 45 }),
    verify: vi.fn().mockResolvedValue(undefined),
    describe: () => "described",
  };
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("useEmailCode", () => {
  it("sends to the normalized address, rejects a wrong code and accepts the right one", async () => {
    act(() => root.render(<Probe />));
    await act(async () => (host.querySelector("[data-send]") as HTMLButtonElement).click());
    await flush();
    expect(options.request).toHaveBeenCalledWith("ali@example.com");
    expect(out().dataset.stage).toBe("sent");
    expect(out().dataset.retry).toBe("45");

    vi.mocked(options.verify).mockRejectedValueOnce(new AppError({ status: 400, message: "Kod noto'g'ri" }));
    await typeCode("11111");
    expect(out().dataset.invalid).toBe("true");
    expect(out().dataset.stage).toBe("sent");

    await typeCode("12345");
    expect(options.verify).toHaveBeenLastCalledWith("ali@example.com", "12345");
    expect(out().dataset.stage).toBe("verified");
  });

  it("stays on the email step and explains a failed send", async () => {
    vi.mocked(options.request).mockRejectedValueOnce(new AppError({ status: 503 }));
    act(() => root.render(<Probe />));
    await act(async () => (host.querySelector("[data-send]") as HTMLButtonElement).click());
    await flush();
    expect(out().dataset.stage).toBe("idle");
    expect(out().dataset.error).toBe("described");
  });
});
