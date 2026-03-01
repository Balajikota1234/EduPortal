import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useAuth } from "./use-auth";

export function useResults() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [api.shared.results.list.path, user?.id],
    queryFn: async () => {
      const res = await fetch(api.shared.results.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch results");
      const data = api.shared.results.list.responses[200].parse(await res.json());
      // Always sort reverse chronological
      return data.sort((a, b) => new Date(b.result.createdAt).getTime() - new Date(a.result.createdAt).getTime());
    },
    enabled: !!user
  });
}

export function useMarkResultRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.shared.results.markRead.path, { id }), {
        method: api.shared.results.markRead.method,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to mark read");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.shared.results.list.path] })
  });
}
