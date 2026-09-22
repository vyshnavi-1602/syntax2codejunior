import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const queryClient = postgres(
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/codecraft_kidz_hub",
);
export const db = drizzle(queryClient, { schema });
