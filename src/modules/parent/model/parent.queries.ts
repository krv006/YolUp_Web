import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateChildRequestDto, LinkAction } from "@/modules/auth";
import { parentApi } from "../api/parent.api";
import type { SetConsentInput } from "../api/parent.dto";

export const parentKeys = Object.freeze({
  all: ["parent"] as const,
  dashboard: (childId?: string | null) => ["parent", "dashboard", childId ?? "all"] as const,
  children: ["parent", "children"] as const,
  links: ["parent", "links"] as const,
  consents: ["parent", "consents"] as const,
  homework: (childId: string | null) => ["parent", "homework", childId] as const,
});

export function useParentDashboard(selectedChildId?: string | null) {
  return useQuery({
    queryKey: parentKeys.dashboard(selectedChildId),
    queryFn: ({ signal }) => parentApi.getDashboard({ signal, selectedChildId }),
  });
}

export function useParentChildren() {
  return useQuery({
    queryKey: parentKeys.children,
    queryFn: ({ signal }) => parentApi.getChildren({ signal }),
  });
}

export function useParentLinks(enabled = true) {
  return useQuery({
    queryKey: parentKeys.links,
    queryFn: ({ signal }) => parentApi.getLinks({ signal }),
    enabled,
  });
}

export function useParentConsents() {
  return useQuery({
    queryKey: parentKeys.consents,
    queryFn: ({ signal }) => parentApi.getConsents({ signal }),
  });
}

export function useParentHomework(selectedChildId: string | null) {
  return useQuery({
    queryKey: parentKeys.homework(selectedChildId),
    queryFn: ({ signal }) => parentApi.getHomework(selectedChildId as string, { signal }),
    enabled: Boolean(selectedChildId),
  });
}

export function useRequestChildLink({ notify = true }: { notify?: boolean } = {}) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => parentApi.requestLink(inviteCode),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: parentKeys.all });
      if (notify) toast.success("Bog‘lash so‘rovi yuborildi");
    },
  });
}

export function useCreateChild({ notify = true }: { notify?: boolean } = {}) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateChildRequestDto) => parentApi.createChild(dto),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: parentKeys.all });
      if (notify) toast.success("Bola hisobi yaratildi");
    },
  });
}

export function useRespondParentLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: LinkAction }) =>
      parentApi.respondLink(id, action),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: parentKeys.all });
      toast.success("So‘rov yangilandi");
    },
  });
}

export function useSetParentConsent({ notify = true }: { notify?: boolean } = {}) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetConsentInput) => parentApi.setConsent(dto),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: parentKeys.consents });
      if (notify) toast.success("Maxfiylik ruxsati saqlandi");
    },
  });
}
