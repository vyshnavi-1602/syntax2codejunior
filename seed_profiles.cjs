require("dotenv").config();
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

async function seedProfiles() {
  console.log("Checking and seeding student profiles...");
  const students = await sql`SELECT id, name, email, school_id FROM "user" WHERE role = 'student'`;
  console.log("Found students:", students);

  for (const s of students) {
    const existing = await sql`SELECT user_id FROM student_profiles WHERE user_id = ${s.id}`;
    if (existing.length === 0) {
      console.log(`Inserting profile for student ${s.name} (${s.id})`);
      await sql`
        INSERT INTO student_profiles (user_id, class_id, xp_total, current_streak, level)
        VALUES (${s.id}, NULL, 120, 2, 1)
      `;
    }
  }

  const allProfiles = await sql`SELECT * FROM student_profiles`;
  console.log("Updated profiles:", allProfiles);
  await sql.end();
}

seedProfiles().catch(console.error);
