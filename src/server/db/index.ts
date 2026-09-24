import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

console.log("DATABASE_URL IS:", process.env.DATABASE_URL);
const queryClient = postgres(
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/codecraft_kidz_hub",
  {
    max: 10,
    connect_timeout: 15,
  },
);
export const db = drizzle(queryClient, { schema });
