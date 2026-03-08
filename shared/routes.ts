import { z } from "zod";
import { insertUserSchema, insertTestSchema, insertQuestionSchema, users, tests, questions, results } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  forbidden: z.object({ message: z.string() })
};

export const userResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  role: z.string(),
  group: z.string().nullable().optional(),
  linkedStudentId: z.number().nullable().optional()
});

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login" as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized
      }
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout" as const,
      responses: { 200: z.void() }
    },
    me: {
      method: "GET" as const,
      path: "/api/user" as const,
      responses: { 
        200: userResponseSchema,
        401: errorSchemas.unauthorized 
      }
    }
  },
  admin: {
    users: {
      list: {
        method: "GET" as const,
        path: "/api/users" as const,
        responses: { 200: z.array(userResponseSchema) }
      },
      create: {
        method: "POST" as const,
        path: "/api/users" as const,
        input: insertUserSchema,
        responses: {
          201: userResponseSchema,
          400: errorSchemas.validation
        }
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/users/:id" as const,
        responses: { 200: z.void() }
      }
    }
  },
  teacher: {
    tests: {
      list: {
        method: "GET" as const,
        path: "/api/tests" as const,
        responses: { 200: z.array(z.custom<typeof tests.$inferSelect>()) }
      },
      create: {
        method: "POST" as const,
        path: "/api/tests" as const,
        input: insertTestSchema,
        responses: { 201: z.custom<typeof tests.$inferSelect>() }
      },
      update: {
        method: "PUT" as const,
        path: "/api/tests/:id" as const,
        input: insertTestSchema.partial(),
        responses: { 200: z.custom<typeof tests.$inferSelect>() }
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/tests/:id" as const,
        responses: { 200: z.void() }
      },
      getQuestions: {
        method: "GET" as const,
        path: "/api/tests/:testId/questions" as const,
        responses: { 200: z.array(z.custom<typeof questions.$inferSelect>()) }
      },
      addQuestion: {
        method: "POST" as const,
        path: "/api/tests/:testId/questions" as const,
        input: insertQuestionSchema.omit({ testId: true }),
        responses: { 201: z.custom<typeof questions.$inferSelect>() }
      },
      updateQuestion: {
        method: "PUT" as const,
        path: "/api/questions/:id" as const,
        input: insertQuestionSchema.partial(),
        responses: { 200: z.custom<typeof questions.$inferSelect>() }
      },
      deleteQuestion: {
        method: "DELETE" as const,
        path: "/api/questions/:id" as const,
        responses: { 200: z.void() }
      }
    }
  },
  student: {
    tests: {
      list: {
        method: "GET" as const,
        path: "/api/student/tests" as const,
        responses: { 200: z.array(z.custom<typeof tests.$inferSelect>()) }
      },
      get: {
        method: "GET" as const,
        path: "/api/student/tests/:id" as const,
        responses: { 
          200: z.object({
            test: z.custom<typeof tests.$inferSelect>(),
            questions: z.array(insertQuestionSchema.extend({ id: z.number() }).omit({ correctOpt: true }))
          }),
          404: errorSchemas.notFound
        }
      },
      submit: {
        method: "POST" as const,
        path: "/api/student/tests/:id/submit" as const,
        input: z.object({
          answers: z.record(z.string(), z.number()), // questionId -> chosen option (1-4)
          timeTaken: z.number() // seconds
        }),
        responses: {
          201: z.custom<typeof results.$inferSelect>(),
          400: errorSchemas.validation
        }
      },
      review: {
        method: "GET" as const,
        path: "/api/student/results/:resultId/review" as const,
        responses: {
          200: z.object({
            result: z.custom<typeof results.$inferSelect>(),
            questions: z.array(z.custom<typeof questions.$inferSelect>())
          }),
          404: errorSchemas.notFound
        }
      }
    }
  },
  shared: {
    results: {
      list: {
        method: "GET" as const,
        path: "/api/results" as const,
        input: z.object({ testId: z.string().optional() }).optional(),
        responses: { 
          200: z.array(z.object({
            result: z.custom<typeof results.$inferSelect>(),
            test: z.custom<typeof tests.$inferSelect>(),
            student: userResponseSchema
          }))
        }
      },
      markRead: {
        method: "PATCH" as const,
        path: "/api/results/:id/read" as const,
        responses: { 200: z.custom<typeof results.$inferSelect>() }
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}