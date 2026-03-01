import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users } from "./shared/schema.js";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Check if admin already exists
const existing = await db.select().from(users).where(eq(users.username, "admin"));

if (existing.length === 0) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync("admin123", salt, 64);
  const hash = buf.toString("hex") + "." + salt;

  await db.insert(users).values({
    username: "admin",
    password: hash,
    role: "admin",
  });
  console.log("✅ Admin user created!");
} else {
  console.log("✅ Admin already exists, skipping.");
}

await pool.end();