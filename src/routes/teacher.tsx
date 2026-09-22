import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/client/components/app/AppShell";

export const Route = createFileRoute("/teacher")({
  component: () => (
    <AppShell allow="teacher">
      <Outlet />
    </AppShell>
  ),
});
