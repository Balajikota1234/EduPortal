import { db } from "./db";
import { 
  users, tests, questions, results,
  type User, type InsertUser, 
  type Test, type InsertTest, type UpdateTestRequest,
  type Question, type InsertQuestion, type UpdateQuestionRequest,
  type Result, type InsertResult 
} from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";

const MStore = MemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<void>;

  getTests(): Promise<Test[]>;
  getTest(id: number): Promise<Test | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: UpdateTestRequest): Promise<Test | undefined>;
  deleteTest(id: number): Promise<void>;

  getQuestionsByTest(testId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: UpdateQuestionRequest): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<void>;

  getResultsByStudent(studentId: number): Promise<Result[]>;
  getResultsByTest(testId: number): Promise<Result[]>;
  getAllResults(): Promise<Result[]>;
  createResult(result: InsertResult): Promise<Result>;
  markResultAsRead(id: number): Promise<Result | undefined>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getTests(): Promise<Test[]> {
    return await db.select().from(tests);
  }

  async getTest(id: number): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test;
  }

  async createTest(test: InsertTest): Promise<Test> {
    const [newTest] = await db.insert(tests).values(test).returning();
    return newTest;
  }

  async updateTest(id: number, update: UpdateTestRequest): Promise<Test | undefined> {
    const [updated] = await db.update(tests).set(update).where(eq(tests.id, id)).returning();
    return updated;
  }

  async deleteTest(id: number): Promise<void> {
    await db.delete(tests).where(eq(tests.id, id));
  }

  async getQuestionsByTest(testId: number): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.testId, testId));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQ] = await db.insert(questions).values(question).returning();
    return newQ;
  }

  async updateQuestion(id: number, update: UpdateQuestionRequest): Promise<Question | undefined> {
    const [updated] = await db.update(questions).set(update).where(eq(questions.id, id)).returning();
    return updated;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async getResultsByStudent(studentId: number): Promise<Result[]> {
    return await db.select().from(results).where(eq(results.studentId, studentId));
  }

  async getResultsByTest(testId: number): Promise<Result[]> {
    return await db.select().from(results).where(eq(results.testId, testId));
  }

  async getAllResults(): Promise<Result[]> {
    return await db.select().from(results);
  }

  async createResult(result: InsertResult): Promise<Result> {
    const [newResult] = await db.insert(results).values({
      ...result,
      answeredQuestions: result.answeredQuestions ?? 0,
      wrongQuestions: result.wrongQuestions ?? 0,
      unansweredQuestions: result.unansweredQuestions ?? 0,
    }).returning();
    return newResult;
  }

  async markResultAsRead(id: number): Promise<Result | undefined> {
    const [updated] = await db.update(results).set({ isRead: true }).where(eq(results.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
