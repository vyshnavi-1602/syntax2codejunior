import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/client/components/app/AppShell";

export const Route = createFileRoute("/school")({
  component: () => (
    <AppShell allow="school">
      <Outlet />
    </AppShell>
  ),
});
