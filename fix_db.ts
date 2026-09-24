import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function fixSchoolIdDefault() {
  console.log("Fixing school_id default...");
  await db.execute(sql`ALTER TABLE "user" ALTER COLUMN school_id DROP DEFAULT;`);
  console.log("school_id default dropped!");
  process.exit(0);
}

fixSchoolIdDefault().catch(console.error);
