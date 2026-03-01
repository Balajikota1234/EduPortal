import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useTests() {
  return useQuery({
    queryKey: [api.teacher.tests.list.path],
    queryFn: async () => {
      const res = await fetch(api.teacher.tests.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tests");
      return api.teacher.tests.list.responses[200].parse(await res.json());
    }
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.teacher.tests.create.path, {
        method: api.teacher.tests.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to create test");
      return api.teacher.tests.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teacher.tests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.student.tests.list.path] });
    }
  });
}

export function useUpdateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(buildUrl(api.teacher.tests.update.path, { id }), {
        method: api.teacher.tests.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to update test");
      return api.teacher.tests.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teacher.tests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.student.tests.list.path] });
    }
  });
}

export function useDeleteTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.teacher.tests.delete.path, { id }), {
        method: api.teacher.tests.delete.method,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete test");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teacher.tests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.student.tests.list.path] });
    }
  });
}

export function useQuestions(testId: number) {
  return useQuery({
    queryKey: [api.teacher.tests.getQuestions.path, testId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.teacher.tests.getQuestions.path, { testId }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch questions");
      return api.teacher.tests.getQuestions.responses[200].parse(await res.json());
    },
    enabled: !!testId,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ testId, ...data }: any) => {
      const res = await fetch(buildUrl(api.teacher.tests.addQuestion.path, { testId }), {
        method: api.teacher.tests.addQuestion.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to create question");
      return api.teacher.tests.addQuestion.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [api.teacher.tests.getQuestions.path, variables.testId] })
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, testId, ...data }: any) => {
      const res = await fetch(buildUrl(api.teacher.tests.updateQuestion.path, { id }), {
        method: api.teacher.tests.updateQuestion.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to update question");
      return api.teacher.tests.updateQuestion.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [api.teacher.tests.getQuestions.path, variables.testId] })
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, testId }: { id: number; testId: number }) => {
      const res = await fetch(buildUrl(api.teacher.tests.deleteQuestion.path, { id }), {
        method: api.teacher.tests.deleteQuestion.method,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete question");
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [api.teacher.tests.getQuestions.path, variables.testId] })
  });
}
