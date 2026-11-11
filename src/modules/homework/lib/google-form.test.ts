import { describe, expect, it } from "vitest";
import type { AssignmentDto } from "../api/homework.dto";
import { googleFormUrlInvalid, isGoogleFormUrl } from "./google-form";
import { mapAssignmentDto, mapAssignmentRequest } from "./homework.mappers";

describe("Google Form link", () => {
  it("accepts only Google Form addresses", () => {
    expect(isGoogleFormUrl("https://forms.gle/AbC123")).toBe(true);
    expect(isGoogleFormUrl(" https://docs.google.com/forms/d/e/1FAIpQ/viewform ")).toBe(true);
    expect(isGoogleFormUrl("https://forms.google.com/d/e/1FAIpQ/viewform")).toBe(true);
    expect(isGoogleFormUrl("http://forms.gle/AbC123")).toBe(false);
    expect(isGoogleFormUrl("https://docs.google.com/document/d/1")).toBe(false);
    expect(isGoogleFormUrl("https://forms.gle.evil.com/x")).toBe(false);
    expect(isGoogleFormUrl(`https://forms.gle/${"a".repeat(500)}`)).toBe(false);
  });

  it("treats an empty field as no link rather than a mistake", () => {
    expect(googleFormUrlInvalid("")).toBe(false);
    expect(googleFormUrlInvalid("   ")).toBe(false);
    expect(googleFormUrlInvalid("forms.gle/abc")).toBe(true);
  });

  it("sends the link, an empty value to remove it, and nothing when untouched", () => {
    const request = (googleFormUrl?: string) => mapAssignmentRequest({ courseId: "c1", title: "Uy ishi", googleFormUrl });
    expect(request(" https://forms.gle/AbC ").get("google_form_url")).toBe("https://forms.gle/AbC");
    expect(request("").get("google_form_url")).toBe("");
    expect(request().has("google_form_url")).toBe(false);
  });

  it("reads the link from the assignment", () => {
    const base = { id: "a1", course_id: "c1", course_title: "Algebra", subject: "math", title: "Uy ishi", due_at: null, created_at: "" };
    expect(mapAssignmentDto({ ...base, google_form_url: "https://forms.gle/AbC" } as AssignmentDto)?.googleFormUrl).toBe(
      "https://forms.gle/AbC"
    );
    expect(mapAssignmentDto(base as AssignmentDto)?.googleFormUrl).toBeNull();
  });
});
