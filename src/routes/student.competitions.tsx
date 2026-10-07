import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/student/competitions")({
  loader: () => {
    throw redirect({ to: "/student/compete" });
  },
  component: () => null,
});
