import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users } from "./shared/schema.js";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const salt = randomBytes(16).toString("hex");
const buf = await scryptAsync("admin123", salt, 64);
const hash = buf.toString("hex") + "." + salt;

await db.insert(users).values({
  username: "admin",
  password: hash,
  role: "admin",
});

console.log("Admin user created! Username: admin, Password: admin123");
await pool.end();