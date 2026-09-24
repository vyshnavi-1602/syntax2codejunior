import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  Avatar,
  FilterChips,
  PageHeader,
  Panel,
  Pill,
  Stat,
} from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";

import { getGlobalUsersFn, manageUserRoleFn } from "@/api/admin.server";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Directory · Syntax2Code Platform" },
      {
        name: "description",
        content:
          "Platform-wide directory of students, teachers and school admins with access controls.",
      },
      { property: "og:title", content: "User Directory · Syntax2Code Platform" },
      {
        property: "og:description",
        content: "Search, filter and manage every account across the network.",
      },
    ],
  }),
  loader: async () => {
    return await getGlobalUsersFn();
  },
  component: AdminUsers,
});

const roles = ["All roles", "Student", "Teacher", "School Admin"] as const;

function AdminUsers() {
  const { platformUsers, schoolsGlobal } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]>("All roles");
  const [school, setSchool] = useState("All schools");
  const [users, setUsers] = useState(platformUsers);

  const rows = users.filter(
    (u) =>
      (role === "All roles" || u.role === role) &&
      (school === "All schools" || u.school === school) &&
      u.name.toLowerCase().includes(q.toLowerCase()),
  );

  const initials = (n: string) =>
    n
      .replace(/(Dr\.|Fr\.|Ms\.|Mr\.)\s*/g, "")
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("");

  return (
    <>
      <PageHeader
        title="User Directory"
        subtitle="92,430 accounts across 148 schools · sampled view"
        actions={
          <button
            onClick={() =>
              toast.success("Directory export queued", {
                description: "platform_users.csv will be emailed to you.",
              })
            }
            className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Export directory
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Students" value="88,940" sub="96% of accounts" tone="sky" />
        <Stat label="Teachers" value="3,142" sub="Across all schools" tone="violet" />
        <Stat label="School admins" value="348" sub="Principals and directors" tone="teal" />
        <Stat
          label="Suspended"
          value={users.filter((u) => !u.active).length}
          sub="In this sample"
          tone="rose"
        />
      </div>

      <Panel title="Accounts" description={`${rows.length} results`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name…"
              className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <select
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300"
          >
            <option>All schools</option>
            {schoolsGlobal.map((s) => (
              <option key={s.id}>{s.name}</option>
            ))}
          </select>
          <FilterChips options={roles} value={role} onChange={setRole} />
        </div>

        <div className="mt-5 space-y-2.5">
          {rows.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-3.5"
            >
              <Avatar initials={initials(u.name)} size="sm" />
              <div className="min-w-40 flex-1">
                <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                <p className="text-xs text-slate-500">
                  {u.detail} · {u.school}
                </p>
              </div>
              <Pill tone={u.role === "Student" ? "sky" : u.role === "Teacher" ? "violet" : "teal"}>
                {u.role}
              </Pill>
              <span className="w-24 text-right text-xs text-slate-400">{u.lastSeen}</span>
              <select
                defaultValue={u.school}
                onChange={async (e) => {
                  const targetSchool = schoolsGlobal.find((s) => s.name === e.target.value);
                  if (targetSchool) {
                    try {
                      await manageUserRoleFn({
                        data: { targetUserId: u.id, newSchoolId: targetSchool.id },
                      });
                      setUsers((l) =>
                        l.map((x) => (x.id === u.id ? { ...x, school: e.target.value } : x)),
                      );
                      toast.success(`${u.name} reassigned`, { description: e.target.value });
                    } catch (err: unknown) {
                      toast.error("Failed to reassign school", {
                        description: (err as Error).message,
                      });
                    }
                  }
                }}
                className="h-9 max-w-52 rounded-lg border border-slate-200 px-2 text-xs text-slate-600"
              >
                {schoolsGlobal.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={async () => {
                  try {
                    await manageUserRoleFn({ data: { targetUserId: u.id, active: !u.active } });
                    setUsers((l) =>
                      l.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x)),
                    );
                    toast(`${u.name} ${u.active ? "suspended" : "reactivated"}`);
                  } catch (err: unknown) {
                    toast.error("Failed to update status", { description: (err as Error).message });
                  }
                }}
                className={cn(
                  "h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors",
                  u.active ? "bg-emerald-500" : "bg-slate-200",
                )}
              >
                <span
                  className={cn(
                    "block h-4 w-4 rounded-full bg-white transition-transform",
                    u.active && "translate-x-4",
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
