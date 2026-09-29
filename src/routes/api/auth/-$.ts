// @ts-expect-error - Route tree generation might be pending
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { auth } from "@/server/auth/auth";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: ({ request }: { request: Request }) => {
    console.log("[DEBUG] API Route GET", request.url);
    return auth.handler(request);
  },
  POST: ({ request }: { request: Request }) => {
    console.log("[DEBUG] API Route POST", request.url);
    return auth.handler(request);
  },
});
