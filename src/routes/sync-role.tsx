import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { syncUserRoleFn } from "@/api/auth.server";
import { Loader2 } from "lucide-react";
import { roleHome, type RoleId } from "@/client/lib/session";

export const Route = createFileRoute("/sync-role")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      role: (search.role as string) || "student",
    };
  },
  component: SyncRolePage,
});

function SyncRolePage() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    syncUserRoleFn({ data: role })
      .then(() => {
        // Force a full page reload to clear any cached session role states in the server/router
        window.location.href = roleHome[role as string] || "/dashboard";
      })
      .catch((err) => {
        console.error("Failed to sync role", err);
        window.location.href = "/login";
      });
  }, [role]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
      <p>Setting up your {role} workspace...</p>
    </div>
  );
}
