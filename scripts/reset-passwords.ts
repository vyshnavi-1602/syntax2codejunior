import { hashPassword } from "better-auth/crypto";
import { db } from "../src/server/db";
import * as schema from "../src/server/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  console.log("Hashing password 'Password@123'...");
  const newHash = await hashPassword("Password@123");
  console.log("Generated hash:", newHash);

  const emails = [
    "teacher@syntax2code.com",
    "admin@syntax2code.com",
    "school@syntax2code.com",
    "student@syntax2code.com",
  ];

  const users = await db.select().from(schema.user).where(inArray(schema.user.email, emails));
  console.log(`Found ${users.length} users to update.`);

  for (const u of users) {
    const existing = await db
      .select()
      .from(schema.account)
      .where(eq(schema.account.userId, u.id));

    if (existing.length > 0) {
      await db
        .update(schema.account)
        .set({ password: newHash, providerId: "credential", updatedAt: new Date() })
        .where(eq(schema.account.id, existing[0].id));
      console.log(`Updated password for ${u.email} (${u.role})`);
    } else {
      const newId = "acc_" + Math.random().toString(36).substring(2, 12);
      await db.insert(schema.account).values({
        id: newId,
        accountId: u.id,
        providerId: "credential",
        userId: u.id,
        password: newHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Created credential account for ${u.email} (${u.role})`);
    }
  }

  console.log("All credentials updated successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error updating passwords:", err);
  process.exit(1);
});
