export const STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN: "fokus_access_token",
  REFRESH_TOKEN: "fokus_refresh_token",
  USER_SNAPSHOT: "fokus_user",
  CONVERSATION_PANEL_WIDTH: "fokus_conversation_width",
  STUDENT_CONVERSATION_PANEL_WIDTH: "fokus_student_conversation_width",
  PARENT_SELECTED_CHILD: "fokus_parent_selected_child",
  THEME: "fokus_theme",
  LANGUAGE: "fokus_language",
  LESSON_VIEW: "fokus_lesson_view",
  CONVERSATION_FILTER: "fokus_conversation_filter",
  CHAT_PINNED_MESSAGES: "fokus_chat_pinned",
  CONVERSATION_PREFS: "fokus_conversation_prefs",
  TEXT_SIZE: "fokus_text_size",
});

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
