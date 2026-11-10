import { useMutation, useQueryClient } from "@tanstack/react-query";
import { channelApi, type AudienceInput, type ChannelInput } from "../api/channel.api";
import { conversationKeys } from "./conversation.keys";

function useRefresh() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: conversationKeys.all });
}

export function useCreateChannel() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (input: ChannelInput) => channelApi.create(input), onSuccess: refresh });
}

export function useUpdateChannel() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, title, description }: { id: string; title?: string; description?: string }) =>
      channelApi.update(id, { title, description }),
    onSuccess: refresh,
  });
}

export function useDeleteChannel() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (id: string) => channelApi.remove(id), onSuccess: refresh });
}

export function useAddChannelMembers() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, audience }: { id: string; audience: AudienceInput }) => channelApi.addMembers(id, audience),
    onSuccess: refresh,
  });
}

export function useRemoveChannelMember() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => channelApi.removeMember(id, userId),
    onSuccess: refresh,
  });
}
