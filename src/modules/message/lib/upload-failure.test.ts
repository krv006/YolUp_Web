import { describe, expect, it } from "vitest";
import { API_ERROR_CODES, AppError } from "@/shared/api";
import { uploadFailureReason } from "./upload-failure";

describe("uploadFailureReason", () => {
  it("explains a timeout and shows the backend file limit message", () => {
    expect(uploadFailureReason(new AppError({ code: API_ERROR_CODES.TIMEOUT }), "Vaqt tugadi")).toBe("Vaqt tugadi");
    expect(uploadFailureReason(new AppError({ code: API_ERROR_CODES.VALIDATION_ERROR, status: 400, message: "Xato", fields: { file: ["Fayl 20 MB dan katta."] } }), "x")).toBe(
      "Fayl 20 MB dan katta."
    );
    expect(uploadFailureReason(new AppError({ code: API_ERROR_CODES.OFFLINE, message: "Internet aloqasi mavjud emas" }), "x")).toBe("Internet aloqasi mavjud emas");
  });
});
