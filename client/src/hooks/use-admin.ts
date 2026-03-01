import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useUsers() {
  return useQuery({
    queryKey: [api.admin.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.admin.users.list.responses[200].parse(await res.json());
    }
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.admin.users.create.path, {
        method: api.admin.users.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to create user");
      return api.admin.users.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.users.list.path] })
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.admin.users.delete.path, { id }), {
        method: api.admin.users.delete.method,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.users.list.path] })
  });
}
