import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supportApi } from "../api/support.api";
import type { SupportTicket, SupportTicketStatus } from "../api/support.dto";

export const supportKeys = Object.freeze({
  all: ["support"] as const,
  tickets: ["support", "tickets"] as const,
  ticketList: (all: boolean, status: string | null) => ["support", "tickets", all ? "all" : "mine", status ?? "any"] as const,
  ticket: (id: string) => ["support", "ticket", id] as const,
  videos: ["support", "videos"] as const,
  faq: ["support", "faq"] as const,
});

export function useSupportTickets(filters: { all?: boolean; status?: SupportTicketStatus | null } = {}, enabled = true) {
  return useQuery({
    queryKey: supportKeys.ticketList(Boolean(filters.all), filters.status ?? null),
    queryFn: ({ signal }) => supportApi.getTickets(filters, { signal }),
    enabled,
    refetchInterval: filters.all ? 30_000 : false,
  });
}

export function useSupportTicket(id: string | null) {
  return useQuery({
    queryKey: supportKeys.ticket(id ?? ""),
    queryFn: ({ signal }) => supportApi.getTicket(id as string, { signal }),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
}

function useTicketUpdate() {
  const client = useQueryClient();
  return (ticket: SupportTicket) => {
    client.setQueryData(supportKeys.ticket(ticket.id), (current: SupportTicket | undefined) =>
      ticket.messages.length || !current ? ticket : { ...current, status: ticket.status }
    );
    client.invalidateQueries({ queryKey: supportKeys.tickets });
  };
}

export function useCreateSupportTicket() {
  const update = useTicketUpdate();
  return useMutation({ mutationFn: supportApi.createTicket, onSuccess: update });
}

export function useReplySupportTicket(id: string) {
  const update = useTicketUpdate();
  return useMutation({ mutationFn: (message: string) => supportApi.reply(id, message), onSuccess: update });
}

export function useCloseSupportTicket(id: string) {
  const update = useTicketUpdate();
  return useMutation({ mutationFn: () => supportApi.close(id), onSuccess: update });
}

export function useHelpVideos() {
  return useQuery({ queryKey: supportKeys.videos, queryFn: ({ signal }) => supportApi.getVideos({ signal }), staleTime: 300_000 });
}

export function useHelpFaq() {
  return useQuery({ queryKey: supportKeys.faq, queryFn: ({ signal }) => supportApi.getFaq({ signal }), staleTime: 300_000 });
}
