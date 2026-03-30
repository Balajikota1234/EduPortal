import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student", "parent"] }).notNull(),
  group: text("group", { enum: ["eamcet", "iit", "neet", "defence"] }),
  linkedStudentId: integer("linked_student_id"), 
});

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  duration: integer("duration").notNull(), // minutes
  teacherId: integer("teacher_id").notNull(),
  isPublished: boolean("is_published").default(false),
  targetGroups: text("target_groups").array().default(sql`'{}'::text[]`),
  correctPoints: integer("correct_points").default(4),
  wrongPoints: integer("wrong_points").default(-1),
  totalMarks: integer("total_marks").default(100),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  question: text("question").notNull(),
  opt1: text("opt1").notNull(),
  opt2: text("opt2").notNull(),
  opt3: text("opt3").notNull(),
  opt4: text("opt4").notNull(),
  correctOpt: integer("correct_opt").notNull(),
});

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  studentId: integer("student_id").notNull(),
  score: integer("score").notNull(), // This will store correct answers count
  totalQuestions: integer("total_questions").notNull(),
  answeredQuestions: integer("answered_questions").default(0),
  wrongQuestions: integer("wrong_questions").default(0),
  unansweredQuestions: integer("unanswered_questions").default(0),
  timeTaken: integer("time_taken").notNull(), // seconds
  isRead: boolean("is_read").default(false),
  answers: text("answers"), // Store student answers as JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTestSchema = createInsertSchema(tests).omit({ id: true, createdAt: true, teacherId: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertResultSchema = createInsertSchema(results).omit({ id: true, createdAt: true, studentId: true });

// Explicit API Contract Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;
export type UpdateTestRequest = Partial<InsertTest>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type UpdateQuestionRequest = Partial<InsertQuestion>;

export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;