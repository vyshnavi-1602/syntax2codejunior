const postgres = require("postgres");
require("dotenv").config();

async function run() {
  const sql = postgres(
    process.env.DATABASE_URL ||
      "postgresql://neondb_owner:npg_cjJaGke6il1W@ep-twilight-union-b4x5ot8s.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require",
  );

  console.log("Creating school_schedules and platform_schedules tables if they do not exist...");

  await sql`
    CREATE TABLE IF NOT EXISTS school_schedules (
      id SERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
      teacher_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      subject TEXT DEFAULT 'Computer Science' NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT NOT NULL,
      schedule_type TEXT DEFAULT 'regular_class' NOT NULL,
      recurrence TEXT DEFAULT 'weekly' NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS platform_schedules (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'event' NOT NULL,
      target_school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
      target_role TEXT DEFAULT 'all' NOT NULL,
      scheduled_start TIMESTAMP NOT NULL,
      scheduled_end TIMESTAMP NOT NULL,
      recurrence TEXT DEFAULT 'once' NOT NULL,
      status TEXT DEFAULT 'scheduled' NOT NULL,
      priority TEXT DEFAULT 'medium' NOT NULL,
      is_automated BOOLEAN DEFAULT FALSE NOT NULL,
      action_payload TEXT,
      created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  console.log("Tables created successfully!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
