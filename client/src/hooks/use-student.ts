import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useStudentTests() {
  return useQuery({
    queryKey: [api.student.tests.list.path],
    queryFn: async () => {
      const res = await fetch(api.student.tests.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tests");
      return api.student.tests.list.responses[200].parse(await res.json());
    },
    staleTime: 0,
    refetchOnMount: true
  });
}

export function useStudentTestDetails(id: number) {
  return useQuery({
    queryKey: [api.student.tests.get.path, id],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.student.tests.get.path, { id }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch test details");
      return api.student.tests.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useSubmitTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; answers: Record<string, number>; timeTaken: number }) => {
      const res = await fetch(buildUrl(api.student.tests.submit.path, { id }), {
        method: api.student.tests.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to submit test");
      return api.student.tests.submit.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shared.results.list.path] });
    }
  });
}
