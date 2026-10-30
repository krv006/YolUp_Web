import { createContext, useContext } from "react";

export const RealtimeHubContext = createContext(false);

export function useRealtimeHubActive(): boolean {
  return useContext(RealtimeHubContext);
}
