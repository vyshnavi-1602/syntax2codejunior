import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/client/components/app/AppShell";

const TeacherLayout = () => {
  return (
    <AppShell allow="teacher">
      <Outlet />
    </AppShell>
  );
};

export const Route = createFileRoute("/teacher")({
  component: TeacherLayout,
});
