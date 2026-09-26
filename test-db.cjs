const postgres = require("postgres");
const sql = postgres(
  "postgresql://neondb_owner:npg_cjJaGke6il1W@ep-twilight-union-b4x5ot8s.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require",
);
sql`SELECT 1`
  .then(() => {
    console.log("Connected!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
