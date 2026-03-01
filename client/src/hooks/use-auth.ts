import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "./use-toast";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      return parseWithLogging(api.auth.me.responses[200], data, "auth.me");
    },
    retry: false,
  });

  const login = useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.login.input>) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid username or password");
        throw new Error("Failed to login");
      }
      return parseWithLogging(api.auth.login.responses[200], await res.json(), "auth.login");
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data);
      toast({ title: "Welcome back", description: `Logged in as ${data.username}` });
      if (data.role === "admin") setLocation("/admin");
      else if (data.role === "teacher") setLocation("/teacher");
      else if (data.role === "student") setLocation("/student");
      else if (data.role === "parent") setLocation("/parent");
    },
    onError: (err: Error) => {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    }
  });

  const logout = useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { method: api.auth.logout.method, credentials: "include" });
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    }
  });

  return { user, isLoading, login, logout };
}
