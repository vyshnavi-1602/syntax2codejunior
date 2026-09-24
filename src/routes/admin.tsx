import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/client/components/app/AppShell";

const AdminLayout = () => {
  return (
    <AppShell allow="s2c">
      <Outlet />
    </AppShell>
  );
};

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});
