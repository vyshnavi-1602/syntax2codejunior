import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/server/db/schema";
import "dotenv/config";

const client = postgres(
  process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5432/codecraft_kidz_hub",
);
const db = drizzle(client);

async function seedClubs() {
  console.log("Seeding clubs...");

  let users = await db.select().from(schema.user).limit(1);
  if (users.length === 0) {
    console.log("No users found. Inserting a dummy teacher...");
    const [inserted] = await db.insert(schema.user).values({
      id: "teacher-1",
      name: "Ms. Priya Raman",
      email: "priya.raman@greenfield.edu.in",
      emailVerified: true,
      role: "teacher",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    users = [inserted];
  }
  const teacherId = users[0].id;

  await db.insert(schema.clubs).values([
    {
      name: "AI Mavericks",
      description: "Building real machine learning models to solve school problems.",
      meetingTime: "Wednesdays, 4 PM",
      teacherId,
    },
    {
      name: "Game Dev Guild",
      description: "Designing 2D and 3D games from scratch using Unity and Godot.",
      meetingTime: "Fridays, 3:30 PM",
      teacherId,
    },
    {
      name: "Robotics Core",
      description: "Programming hardware, from Arduino basics to autonomous bots.",
      meetingTime: "Tuesdays, 4 PM",
      teacherId,
    },
    {
      name: "Web Wizards",
      description: "Full-stack web development. React, APIs, databases.",
      meetingTime: "Mondays, 3:30 PM",
      teacherId,
    },
  ]);

  console.log("Clubs seeded successfully!");
  process.exit(0);
}

seedClubs().catch((err) => {
  console.error(err);
  process.exit(1);
});
