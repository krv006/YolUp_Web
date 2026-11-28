import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/locales/en/help.json";
import ru from "@/shared/i18n/locales/ru/help.json";
import uz from "@/shared/i18n/locales/uz/help.json";
import { articlesFor, HELP_ARTICLES, HELP_CATEGORIES, popularFor, TICKET_TOPICS } from "./help-content";

type Locale = typeof uz;

describe("help content", () => {
  it("has every article, category and ticket topic translated in all languages", () => {
    for (const locale of [uz, ru, en] as Locale[]) {
      for (const article of HELP_ARTICLES) {
        const text = locale.articles[article.id as keyof Locale["articles"]] as { title: string; hint: string; intro: string; steps: string[] };
        expect(text?.title, article.id).toBeTruthy();
        expect(text.hint, article.id).toBeTruthy();
        expect(text.intro, article.id).toBeTruthy();
        expect(text.steps.length, article.id).toBeGreaterThan(1);
      }
      for (const category of HELP_CATEGORIES) expect(locale.categories[category.id].title).toBeTruthy();
      for (const topic of TICKET_TOPICS) expect(locale.topics[topic.id].title).toBeTruthy();
    }
  });

  it("filters articles by role and gives every role popular questions", () => {
    expect(articlesFor("student").some((article) => article.id === "createLesson")).toBe(false);
    expect(articlesFor("teacher").some((article) => article.id === "createLesson")).toBe(true);
    for (const role of ["teacher", "student", "parent"] as const) expect(popularFor(role).length).toBeGreaterThanOrEqual(4);
  });
});
