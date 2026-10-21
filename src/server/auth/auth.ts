import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import dns from "node:dns";
import { db } from "../db";
import * as schema from "../db/schema";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore in environments where not supported
}

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.RENDER_EXTERNAL_URL ? process.env.RENDER_EXTERNAL_URL : "http://localhost:8080");

const trustedOrigins = (request?: Request) => {
  const allowed = new Set<string>([
    baseURL,
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "https://syntax2codejunior.onrender.com",
    "https://syntax2codejunior-1.onrender.com",
  ]);

  if (request) {
    try {
      const origin = request.headers.get("origin");
      if (origin) {
        const url = new URL(origin);
        const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
        const isRender = url.hostname.endsWith(".onrender.com");
        const isVercel = url.hostname.endsWith(".vercel.app");
        const isBaseUrl = baseURL.includes(url.hostname);
        if (isLocal || isRender || isVercel || isBaseUrl) {
          allowed.add(origin);
        }
      }
    } catch {
      // ignore invalid URL
    }
  }

  return Array.from(allowed);
};

const hasGoogleAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

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
    ...(hasGoogleAuth
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : {}),
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  trustedOrigins,
});
