import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const queryClient =
  globalForDb.conn ??
  postgres(
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/codecraft_kidz_hub",
    {
      max: 10,
      connect_timeout: 15,
      ssl: process.env.DATABASE_URL?.includes("neon.tech") ? "require" : false,
    },
  );

if (process.env.NODE_ENV !== "production") globalForDb.conn = queryClient;

export const db = drizzle(queryClient, { schema });
