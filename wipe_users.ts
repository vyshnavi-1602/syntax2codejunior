import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function clearUsers() {
  await db.execute(sql`TRUNCATE TABLE "user" CASCADE;`);
  console.log("Users cleared!");
  process.exit(0);
}

clearUsers();
