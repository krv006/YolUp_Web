import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { spamReportApi, type SpamReportAction, type SpamReportStatus } from "../api/spam-report.api";

const reportKeys = Object.freeze({
  all: ["admin", "spam-reports"] as const,
  list: (status: SpamReportStatus, page: number) => ["admin", "spam-reports", "list", status, page] as const,
  detail: (id: string) => ["admin", "spam-reports", "detail", id] as const,
});

export function useSpamReports(status: SpamReportStatus, page = 1) {
  return useQuery({
    queryKey: reportKeys.list(status, page),
    queryFn: ({ signal }) => spamReportApi.list(status, page, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useSpamReport(id: string | null) {
  return useQuery({
    queryKey: reportKeys.detail(id ?? ""),
    queryFn: ({ signal }) => spamReportApi.get(id as string, { signal }),
    enabled: Boolean(id),
  });
}

export function useSpamReportAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: SpamReportAction }) => spamReportApi.act(id, action),
    onSuccess: () => client.invalidateQueries({ queryKey: reportKeys.all }),
  });
}
