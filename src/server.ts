import "./client/lib/error-capture";

import { consumeLastCapturedError } from "./client/lib/error-capture";
import { renderErrorPage } from "./client/lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

import { auth } from "./server/auth/auth";

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/auth/")) {
        if (url.pathname === "/api/auth/error") {
          return new Response(null, { status: 302, headers: { Location: "/login" } });
        }

        const authUrl = new URL(request.url);
        const configuredHost = process.env.BETTER_AUTH_URL
          ? new URL(process.env.BETTER_AUTH_URL).host
          : null;
        const allowedHosts = new Set([
          "localhost:8080",
          "localhost:8081",
          "127.0.0.1:8080",
          "127.0.0.1:8081",
          ...(configuredHost ? [configuredHost] : []),
        ]);

        const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
        if (rawHost && allowedHosts.has(rawHost.toLowerCase())) {
          authUrl.host = rawHost;
        } else if (configuredHost) {
          authUrl.host = configuredHost;
        }

        const protoHeader =
          request.headers.get("x-forwarded-proto") ||
          (url.protocol ? url.protocol.replace(":", "") : "http");
        authUrl.protocol = `${protoHeader}:`;

        const authRequest = new Request(authUrl.toString(), request);
        const authResponse = await auth.handler(authRequest);
        return applySecurityHeaders(authResponse);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      return applySecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};

function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
