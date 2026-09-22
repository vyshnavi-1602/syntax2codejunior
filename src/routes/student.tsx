import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/client/components/app/AppShell";

export const Route = createFileRoute("/student")({
  component: () => (
    <AppShell allow="student">
      <Outlet />
    </AppShell>
  ),
});
