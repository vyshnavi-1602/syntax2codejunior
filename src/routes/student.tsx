import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/client/components/app/AppShell";

const StudentLayout = () => {
  return (
    <AppShell allow="student">
      <Outlet />
    </AppShell>
  );
};

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});
