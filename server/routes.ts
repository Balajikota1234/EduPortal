import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { results } from "@shared/schema";
import { eq } from "drizzle-orm";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { setupAuth, hashPassword } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Authentication
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    res.json(req.user);
  });

  // Admin: Users
  app.get(api.admin.users.list.path, async (req, res) => {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post(api.admin.users.create.path, async (req, res) => {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
      const input = api.admin.users.create.input.parse(req.body);
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      if ((err as any).code === '23505') {
        return res.status(400).json({ message: "Username already exists" });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.admin.users.delete.path, async (req, res) => {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    await storage.deleteUser(Number(req.params.id));
    res.sendStatus(200);
  });

  // Teacher: Tests
  app.get(api.teacher.tests.list.path, async (req, res) => {
    if (req.user?.role !== "teacher") return res.status(403).json({ message: "Forbidden" });
    const tests = await storage.getTests();
    // Filter tests by teacherId
    res.json(tests.filter(t => t.teacherId === req.user!.id));
  });

  app.post(api.teacher.tests.create.path, async (req, res) => {
    if (req.user?.role !== "teacher") return res.status(403).json({ message: "Forbidden" });
    try {
      const input = api.teacher.tests.create.input.parse(req.body);
      const test = await storage.createTest({ ...input, teacherId: req.user.id });
      res.status(201).json(test);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.teacher.tests.update.path, async (req, res) => {
    if (req.user?.role !== "teacher") return res.status(403).json({ message: "Forbidden" });
    try {
      const input = api.teacher.tests.update.input.parse(req.body);
      const test = await storage.updateTest(Number(req.params.id), input);
      if (!test) return res.status(404).json({ message: "Test not found" });
      res.json(test);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.teacher.tests.delete.path, async (req, res) => {
    if (req.user?.role !== "teacher") return res.status(403).json({ message: "Forbidden" });
    await storage.deleteTest(Number(req.params.id));
    res.sendStatus(200);
  });

  app.get(api.teacher.tests.getQuestions.path, async (req, res) => {
    if (req.user?.role !== "teacher") return res.status(403).json({ message: "Forbidden" });
    const questions = await storage.getQuestionsByTest(Number(req.params.testId));
    res.json(questions);
  });

  app.post(api.teacher.tests.addQuestion.path, async (req, res) => {
    if (req.user?.role !== "teacher") return res.status(403).json({ message: "Forbidden" });
    try {
      const input = api.teacher.tests.addQuestion.input.parse(req.body);
      const question = await storage.createQuestion({ ...input, testId: Number(req.params.testId) });
      res.status(201).json(question);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.teacher.tests.updateQuestion.path, async (req, res) => {
    if (req.user?.role !== "teacher") return res.status(403).json({ message: "Forbidden" });
    try {
      const input = api.teacher.tests.updateQuestion.input.parse(req.body);
      const question = await storage.updateQuestion(Number(req.params.id), input);
      res.json(question);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.teacher.tests.deleteQuestion.path, async (req, res) => {
    if (req.user?.role !== "teacher") return res.status(403).json({ message: "Forbidden" });
    await storage.deleteQuestion(Number(req.params.id));
    res.sendStatus(200);
  });

  // Student: Tests
  app.get(api.student.tests.list.path, async (req, res) => {
    if (req.user?.role !== "student") return res.status(403).json({ message: "Forbidden" });
    const tests = await storage.getTests();
    const studentGroup = req.user.group;
    
    // Filter tests by student's group
    const filteredTests = tests.filter(t => {
      if (!t.targetGroups || t.targetGroups.length === 0) return true;
      return studentGroup && t.targetGroups.includes(studentGroup);
    });
    
    res.json(filteredTests);
  });

  app.get(api.student.tests.get.path, async (req, res) => {
    if (req.user?.role !== "student") return res.status(403).json({ message: "Forbidden" });
    const test = await storage.getTest(Number(req.params.id));
    if (!test) return res.status(404).json({ message: "Test not found" });
    
    const allQuestions = await storage.getQuestionsByTest(test.id);
    const questionsWithoutAnswer = allQuestions.map(q => {
      const { correctOpt, ...rest } = q;
      return rest;
    });

    res.json({ test, questions: questionsWithoutAnswer });
  });

  app.post(api.student.tests.submit.path, async (req, res) => {
    if (req.user?.role !== "student") return res.status(403).json({ message: "Forbidden" });
    try {
      const input = api.student.tests.submit.input.parse(req.body);
      const testId = Number(req.params.id);
      const test = await storage.getTest(testId);
      if (!test) return res.status(404).json({ message: "Test not found" });

      const questions = await storage.getQuestionsByTest(testId);
      
      const correctPoints = test.correctPoints ?? 4;
      const wrongPoints = test.wrongPoints ?? -1;

      let correctAnswers = 0;
      let answeredQuestions = Object.keys(input.answers).length;
      let wrongQuestions = 0;

      questions.forEach(q => {
        const studentAnswer = input.answers[q.id.toString()];
        if (studentAnswer !== undefined) {
          if (studentAnswer === q.correctOpt) {
            correctAnswers++;
          } else {
            wrongQuestions++;
          }
        }
      });

      const unansweredQuestions = questions.length - answeredQuestions;
      const totalScore = (correctAnswers * correctPoints) + (wrongQuestions * wrongPoints);

      const result = await storage.createResult({
        testId,
        studentId: req.user.id,
        score: totalScore,
        totalQuestions: questions.length,
        answeredQuestions,
        wrongQuestions,
        unansweredQuestions,
        timeTaken: input.timeTaken,
        isRead: false,
        answers: JSON.stringify(input.answers)
      });

      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.student.tests.review.path, async (req, res) => {
    if (req.user?.role !== "student") return res.status(403).json({ message: "Forbidden" });
    const result = await db.select().from(results).where(eq(results.id, Number(req.params.resultId))).limit(1);
    if (!result.length) return res.status(404).json({ message: "Result not found" });
    
    if (result[0].studentId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    
    const questionsList = await storage.getQuestionsByTest(result[0].testId);
    res.json({ result: result[0], questions: questionsList });
  });

  // Shared: Results
  app.get(api.shared.results.list.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    
    let allResults = await storage.getAllResults();
    
    // Filter based on role
    const currentUserId = req.user ? Number(req.user.id) : null;
    if (!currentUserId) return res.status(401).json({ message: "Not authenticated" });

    if (req.user.role === "student") {
      allResults = allResults.filter(r => Number(r.studentId) === currentUserId);
    } else if (req.user.role === "parent") {
      const linkedId = req.user.linkedStudentId ? Number(req.user.linkedStudentId) : null;
      if (!linkedId) return res.json([]);
      allResults = allResults.filter(r => Number(r.studentId) === linkedId);
    } else if (req.user.role === "teacher") {
      const teacherTests = await storage.getTests();
      const teacherTestIds = teacherTests
        .filter(t => Number(t.teacherId) === currentUserId)
        .map(t => t.id);
      allResults = allResults.filter(r => teacherTestIds.includes(r.testId));
    } else if (req.user.role === "admin") {
      // Admin sees everything
    } else {
      return res.json([]);
    }
    
    // Apply testId query filter if present
    if (req.query.testId) {
      allResults = allResults.filter(r => r.testId === Number(req.query.testId));
    }

    const enhancedResults = (await Promise.all(allResults.map(async (r) => {
      const test = await storage.getTest(r.testId);
      const student = await storage.getUser(r.studentId);
      if (!test || !student) return null;
      return { result: r, test, student };
    }))).filter(Boolean);

    res.json(enhancedResults);
  });

  app.patch(api.shared.results.markRead.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const result = await storage.markResultAsRead(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "Not found" });
    res.json(result);
  });

  // Seed default admin user
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      linkedStudentId: null
    });
    console.log("Created default admin user: admin / admin123");
  }
}
