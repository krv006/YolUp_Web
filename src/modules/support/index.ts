export { supportApi } from "./api/support.api";
export type {
  FaqItem,
  HelpConfig,
  HelpVideo,
  SupportAttachment,
  SupportMessage,
  SupportRating,
  SupportTicket,
  SupportTicketStatus,
  TicketDraft,
} from "./api/support.dto";
export {
  supportKeys,
  useCloseSupportTicket,
  useCreateSupportTicket,
  useCreateTicketDraft,
  useHelpConfig,
  useRateSupportTicket,
  useSendArticleFeedback,
  useHelpFaq,
  useHelpVideos,
  useReplySupportTicket,
  useSupportTicket,
  useSupportTickets,
} from "./model/support.queries";
export { SupportThread } from "./ui/support-thread";
export * from "./content/help-content";
export * from "./lib/help-search";
export * from "./lib/ticket-helpers";
