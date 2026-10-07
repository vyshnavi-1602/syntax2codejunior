import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:8080";
const trustedOrigins = (request?: Request) => {
  const origin = request?.headers?.get("origin");
  const host = request?.headers?.get("host");
  const list = [
    baseURL,
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
  ];
  if (origin && !list.includes(origin)) {
    list.push(origin);
  }
  if (host) {
    const httpHost = `http://${host}`;
    const httpsHost = `https://${host}`;
    if (!list.includes(httpHost)) list.push(httpHost);
    if (!list.includes(httpsHost)) list.push(httpsHost);
  }
  return list;
};

export const auth = betterAuth({
  baseURL,
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false,
      },
      schoolId: {
        type: "number",
        required: false,
        input: false,
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  advanced: {
    useSecureCookies: false,
  },
  trustedOrigins,
});
