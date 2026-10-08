require("dotenv").config();
const postgres = require("postgres");
const dbUrl =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/codecraft_kidz_hub";
const sql = postgres(dbUrl);
sql`SELECT 1`
  .then(() => {
    console.log("Connected!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
