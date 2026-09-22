import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/client/components/app/AppShell";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AppShell allow="s2c">
      <Outlet />
    </AppShell>
  ),
});
