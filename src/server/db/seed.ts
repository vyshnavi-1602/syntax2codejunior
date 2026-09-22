import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

const client = postgres(
  process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5432/codecraft_kidz_hub",
);
const db = drizzle(client);

async function seed() {
  console.log("Seeding database...");

  const [school] = await db
    .insert(schema.schools)
    .values({
      name: "Greenfield International School",
      city: "Mumbai",
      planType: "premium",
    })
    .returning();

  console.log("Inserted school:", school!.id);

  const [teacher] = await db
    .insert(schema.user)
    .values({
      id: "teacher-1",
      name: "Ms. Priya Raman",
      email: "priya.raman@greenfield.edu.in",
      emailVerified: true,
      role: "teacher",
      schoolId: school!.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  console.log("Inserted teacher:", teacher!.id);

  const [cls] = await db
    .insert(schema.classes)
    .values({
      schoolId: school!.id,
      teacherId: teacher!.id,
      name: "Grade 8A",
      grade: "8",
      section: "A",
    })
    .returning();

  console.log("Inserted class:", cls!.id);

  const [path] = await db
    .insert(schema.learningPaths)
    .values({
      title: "Python Builder",
      description: "From first print() to building real mini-apps",
      difficulty: "beginner",
    })
    .returning();

  console.log("Inserted path:", path!.id);

  const [lesson1] = await db
    .insert(schema.lessons)
    .values({
      pathId: path!.id,
      title: "Your first Python program",
      orderIdx: 1,
      xpReward: 20,
      contentMarkdown: `
# Welcome to Python!

In this lesson, you'll learn how to write your very first Python program.

Python is a language that reads your code line by line and executes it. The most basic command is \`print()\`.

Try reading the following code:
\`\`\`python
print("Hello, World!")
\`\`\`
It prints the text "Hello, World!" to the screen. Notice that the text must be surrounded by quotes.
      `,
    })
    .returning();

  console.log("Inserted lesson 1:", lesson1!.id);

  const [lesson2] = await db
    .insert(schema.lessons)
    .values({
      pathId: path!.id,
      title: "Variables and Data Types",
      orderIdx: 2,
      xpReward: 30,
      contentMarkdown: `
# Variables

A variable is like a box where you can store data. 

\`\`\`python
my_score = 100
player_name = "Aarav"
\`\`\`

You can then use the variable later on!
      `,
    })
    .returning();

  console.log("Inserted lesson 2:", lesson2!.id);

  await db.insert(schema.quizzes).values([
    {
      lessonId: lesson1!.id,
      questionText: "Which function is used to output text to the screen in Python?",
      options: ["echo()", "console.log()", "print()", "write()"],
      correctAnswer: "print()",
    },
    {
      lessonId: lesson2!.id,
      questionText: "How do you create a variable named 'age' and assign the value 15 to it?",
      options: ["int age = 15", "age = 15", "let age = 15", "var age = 15"],
      correctAnswer: "age = 15",
    },
  ]);

  console.log("Inserted quizzes.");

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
