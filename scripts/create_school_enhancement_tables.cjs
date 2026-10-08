const postgres = require("postgres");
require("dotenv").config();

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const sql = postgres(dbUrl);

  console.log("Creating teacher_trainings and parent_report_logs tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS teacher_trainings (
      id SERIAL PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      track_id TEXT NOT NULL,
      track_name TEXT NOT NULL,
      status TEXT DEFAULT 'in_progress' NOT NULL,
      progress_percent INTEGER DEFAULT 25 NOT NULL,
      assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
      completed_at TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS parent_report_logs (
      id SERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      recipient_count INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT DEFAULT 'delivered' NOT NULL,
      sent_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  console.log("Tables created successfully!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
