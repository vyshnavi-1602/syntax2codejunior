const postgres = require("postgres");
require("dotenv").config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL environment variable is required.");
  process.exit(1);
}

const sql = postgres(dbUrl);

const REAL_STUDENT_NAMES = [
  "Aarav Sharma",
  "Maya Patel",
  "Ethan Walker",
  "Zoe Chen",
  "Liam O'Connor",
  "Ananya Roy",
  "Lucas Miller",
  "Sophia Williams",
  "Daniel Kim",
  "Emma Johnson",
  "Noah Garcia",
  "Isabella Martinez",
  "Oliver Brown",
  "Ava Davis",
  "Leo Anderson",
  "Chloe Wilson",
  "Aiden Taylor",
  "Mia Thomas",
  "James Jackson",
  "Harper White",
  "Benjamin Lee",
  "Amelia Harris",
  "Henry Clark",
  "Evelyn Lewis",
  "Alexander Robinson",
  "Ella Walker",
  "Sebastian Hall",
  "Scarlett Allen",
  "Jack Young",
  "Grace King",
  "Samuel Wright",
  "Hannah Scott",
  "Matthew Green",
  "Victoria Baker",
  "David Adams",
  "Aria Nelson",
  "Joseph Carter",
  "Penelope Mitchell",
  "Carter Perez",
  "Layla Roberts",
  "Owen Turner",
  "Riley Phillips",
  "Wyatt Campbell",
  "Zoey Parker",
  "John Evans",
  "Nora Edwards",
  "Luke Collins",
  "Lily Stewart",
  "Gabriel Sanchez",
  "Eleanor Morris",
  "Anthony Rogers",
  "Hannah Reed",
  "Dylan Cook",
  "Lillian Morgan",
  "Leo Bell",
  "Addison Murphy",
  "Julian Bailey",
  "Aubrey Rivera",
  "Isaac Cooper",
  "Stella Richardson",
  "Caleb Cox",
  "Natalie Howard",
  "Ryan Ward",
  "Zoe Torres",
  "Nathan Peterson",
  "Leah Gray",
  "Christian Ramirez",
  "Hazel James",
  "Hunter Watson",
  "Violet Brooks",
  "Eli Kelly",
  "Aurora Sanders",
  "Aaron Price",
  "Savannah Bennett",
  "Connor Wood",
  "Bella Hughes",
  "Ezra Flores",
  "Skylar Washington",
  "Thomas Butler",
  "Genesis Simmons",
  "Charles Foster",
  "Paisley Gonzales",
  "Christopher Bryant",
  "Audrey Alexander",
  "Jaxon Russell",
  "Ellie Griffin",
  "Lincoln Diaz",
  "Kinsley Hayes",
  "Hudson Myers",
  "Anna Ford",
  "Adrian Hamilton",
  "Caroline Graham",
  "Nolan Sullivan",
  "Nova Wallace",
  "Easton Woods",
  "Emilia Cole",
  "Colton West",
  "Willow Jordan",
  "Cameron Owens",
  "Everly Reynolds",
];

async function humanizeData() {
  console.log("Starting data humanization and mock cleanup...");

  // 1. Fetch fake robotic students
  const students = await sql`
    SELECT id, name, email FROM "user" 
    WHERE role = 'student' AND (name LIKE 'Student %' OR email LIKE '%@example.com')
    ORDER BY created_at ASC
  `;

  console.log(`Found ${students.length} students with placeholder/robotic names.`);

  const usedEmails = new Set();
  const existingUsers = await sql`SELECT email FROM "user"`;
  existingUsers.forEach((u) => usedEmails.add(u.email.toLowerCase()));

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const realName = REAL_STUDENT_NAMES[i % REAL_STUDENT_NAMES.length];

    // Generate clean email
    const parts = realName
      .toLowerCase()
      .replace(/[^a-z ]/g, "")
      .split(" ");
    let baseEmail = `${parts[0]}.${parts[1]}@globaltech.edu`;
    let email = baseEmail;
    let counter = 1;
    while (usedEmails.has(email) && email !== student.email.toLowerCase()) {
      counter++;
      email = `${parts[0]}.${parts[1]}${counter}@globaltech.edu`;
    }
    usedEmails.add(email);

    await sql`
      UPDATE "user" 
      SET name = ${realName}, email = ${email}, updated_at = NOW()
      WHERE id = ${student.id}
    `;
  }

  console.log(
    `Successfully humanized ${students.length} student profiles with real names and emails!`,
  );

  // 2. Clean up duplicate and placeholder class names
  const classes = await sql`SELECT id, name, grade, section FROM classes ORDER BY id ASC`;
  console.log(`Auditing ${classes.length} classes...`);

  // Distinct distinct class profiles
  const classNamesByGrade = [
    { grade: "6", section: "A", name: "Grade 6A - Python Explorers" },
    { grade: "6", section: "B", name: "Grade 6B - Creative Coding" },
    { grade: "7", section: "A", name: "Grade 7A - Web Foundations" },
    { grade: "7", section: "B", name: "Grade 7B - Interactive Web Dev" },
    { grade: "8", section: "A", name: "Grade 8A - Algorithms & Logic" },
    { grade: "8", section: "B", name: "Grade 8B - Java Coding Lab" },
    { grade: "9", section: "A", name: "Grade 9A - Game Engine Architecture" },
    { grade: "9", section: "B", name: "Grade 9B - AI & Machine Learning" },
    { grade: "10", section: "A", name: "Grade 10A - Full-Stack Projects" },
    { grade: "10", section: "B", name: "Grade 10B - Data Structures & AP CS" },
  ];

  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const target = classNamesByGrade[i % classNamesByGrade.length];
    await sql`
      UPDATE classes
      SET name = ${target.name}, grade = ${target.grade}, section = ${target.section}
      WHERE id = ${cls.id}
    `;
  }

  console.log(`Cleaned up and standardized all ${classes.length} classroom titles.`);
  console.log("Mock data cleanup complete!");
  process.exit(0);
}

humanizeData().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
