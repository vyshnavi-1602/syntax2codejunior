import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/server/db/schema";
import { eq, ilike } from "drizzle-orm";
import "dotenv/config";

const client = postgres(
  process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5432/codecraft_kidz_hub",
);
const db = drizzle(client);

async function updateUser() {
  console.log("Updating user roles to school admin...");

  console.log("Fetching schools...");
  let schools = await db.select().from(schema.schools).limit(1);
  if (schools.length === 0) {
    console.log("No schools found. Inserting one...");
    const [inserted] = await db
      .insert(schema.schools)
      .values({ name: "Greenfield International School" })
      .returning();
    schools = [inserted];
  }
  const schoolId = schools[0].id;

  const targetUsers = await db
    .select()
    .from(schema.user)
    .where(ilike(schema.user.email, "%vrush%"));

  for (const u of targetUsers) {
    console.log(`Updating ${u.email} to schoolId ${schoolId}...`);
    await db
      .update(schema.user)
      .set({ role: "school", schoolId })
      .where(eq(schema.user.id, u.id));
  }

  console.log("Done!");
  process.exit(0);
}

updateUser().catch((err) => {
  console.error(err);
  process.exit(1);
});
