import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { FilterChips, PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { getAllTeacherStudentsFn } from "@/api/teacher.server";

export const Route = createFileRoute("/teacher/students/")({
  head: () => ({
    meta: [
      { title: "Student Directory · Syntax2Code" },
      {
        name: "description",
        content: "Search and view all students enrolled across your classes.",
      },
      { property: "og:title", content: "Student Directory · Syntax2Code" },
    ],
  }),
  loader: async () => {
    try {
      return await getAllTeacherStudentsFn();
    } catch {
      return [];
    }
  },
  component: TeacherStudentsPage,
});

const filters = ["All students", "Needs support", "Accelerated", "On track"] as const;

function TeacherStudentsPage() {
  const students = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All students");

  const list = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.className.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "Needs support") return s.tag === "Needs support";
    if (filter === "Accelerated") return s.tag === "Accelerated";
    if (filter === "On track") return s.tag === "On track";
    return true;
  });

  return (
    <>
      <PageHeader
        title="Student Directory"
        subtitle="Search, monitor and drill down into individual student progress across your classes."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <FilterChips options={filters} value={filter} onChange={setFilter} />

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <Panel
        title="Enrolled Students"
        description={`${list.length} students matching criteria`}
        className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13151b]"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">S2C Score</th>
                <th className="px-4 py-3 font-medium">Attendance</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                    {s.className}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Lv {s.level}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.score}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.attendance}%</td>
                  <td className="px-4 py-3">
                    <Pill
                      tone={
                        s.tag === "Needs support"
                          ? "rose"
                          : s.tag === "Accelerated"
                            ? "emerald"
                            : "sky"
                      }
                    >
                      {s.tag}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/teacher/students/$studentId"
                      params={{ studentId: s.id }}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      View profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
