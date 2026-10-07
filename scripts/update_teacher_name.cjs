const postgres = require("postgres");
require("dotenv").config();

const sql = postgres(
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/codecraft_kidz_hub",
);

async function main() {
  const updated = await sql`
    UPDATE "user"
    SET name = 'Teacher'
    WHERE email = 'teacher@syntax2code.com' OR name ILIKE '%Priya Raman%'
  `;
  console.log("Updated user records count:", updated.count);

  const teachers = await sql`
    SELECT id, name, email, role FROM "user" WHERE role = 'teacher'
  `;
  console.log("Current teachers in DB:", teachers);

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
