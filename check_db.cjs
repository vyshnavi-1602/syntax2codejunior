require("dotenv").config();
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

async function check() {
  const schools = await sql`SELECT * FROM schools`;
  const classes = await sql`SELECT * FROM classes`;
  const users = await sql`SELECT id, name, email, role, school_id FROM "user"`;
  const profiles = await sql`SELECT * FROM student_profiles`;
  console.log("=== SCHOOLS ===\n", schools);
  console.log("=== CLASSES ===\n", classes);
  console.log("=== USERS ===\n", users);
  console.log("=== PROFILES ===\n", profiles);
  await sql.end();
}

check().catch(console.error);
