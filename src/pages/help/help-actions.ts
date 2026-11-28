import { createContext, useContext } from "react";

export interface NewTicketPrefill {
  category?: string;
}

interface HelpActions {
  openNewTicket: (prefill?: NewTicketPrefill) => void;
}

export const HelpActionsContext = createContext<HelpActions>({ openNewTicket: () => undefined });

export function useHelpActions(): HelpActions {
  return useContext(HelpActionsContext);
}
