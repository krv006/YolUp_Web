import { useMutation } from "@tanstack/react-query";
import { tutorApi } from "../api/tutor.api";

export function usePracticeMutation() {
  return useMutation({ mutationFn: tutorApi.practice });
}

export function useExplainMutation() {
  return useMutation({ mutationFn: tutorApi.explain });
}
