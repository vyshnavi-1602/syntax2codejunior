import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/client/components/app/AppShell";

const SchoolLayout = () => {
  return (
    <AppShell allow="school">
      <Outlet />
    </AppShell>
  );
};

export const Route = createFileRoute("/school")({
  component: SchoolLayout,
});
