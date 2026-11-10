import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clubApi, type ClubAudience, type ClubInput } from "../api/club.api";

export const clubKeys = Object.freeze({
  all: ["clubs"] as const,
  list: ["clubs", "list"] as const,
  members: (id: string) => ["clubs", id, "members"] as const,
});

export function useClubs(enabled = true) {
  return useQuery({
    queryKey: clubKeys.list,
    queryFn: ({ signal }) => clubApi.list({ signal }),
    enabled,
    staleTime: 60_000,
  });
}

export function useClubMembers(id: string | null) {
  return useQuery({
    queryKey: clubKeys.members(id ?? ""),
    queryFn: ({ signal }) => clubApi.members(id as string, { signal }),
    enabled: Boolean(id),
  });
}

export function useCreateClub() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ClubInput) => clubApi.create(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: clubKeys.all });
      void client.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useAddClubMembers() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, audience }: { id: string; audience: ClubAudience }) => clubApi.addMembers(id, audience),
    onSuccess: () => client.invalidateQueries({ queryKey: clubKeys.all }),
  });
}

export function useRemoveClubMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, studentId }: { id: string; studentId: string }) => clubApi.removeMember(id, studentId),
    onSuccess: () => client.invalidateQueries({ queryKey: clubKeys.all }),
  });
}
