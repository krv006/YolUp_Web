export { supportApi } from "./api/support.api";
export type { FaqItem, HelpVideo, SupportMessage, SupportTicket, SupportTicketStatus } from "./api/support.dto";
export {
  supportKeys,
  useCloseSupportTicket,
  useCreateSupportTicket,
  useHelpFaq,
  useHelpVideos,
  useReplySupportTicket,
  useSupportTicket,
  useSupportTickets,
} from "./model/support.queries";
export { SupportDialog, SupportThread } from "./ui/support-dialog";
export type { SupportDialogProps } from "./ui/support-dialog";
