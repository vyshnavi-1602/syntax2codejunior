const postgres = require("postgres");
const sql = postgres("postgresql://postgres:postgres@localhost:5432/postgres");

async function main() {
  try {
    await sql`CREATE DATABASE codecraft_kidz_hub`;
    console.log("Database created successfully");
  } catch (e) {
    console.log("Error creating database:", e.message);
  } finally {
    process.exit(0);
  }
}

main();
