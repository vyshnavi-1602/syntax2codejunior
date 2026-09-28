import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  FilterChips,
  PageHeader,
  Panel,
  Pill,
  Stat,
  type Tone,
} from "@/client/components/app/primitives";
import {
  getAdminSchoolsFn,
  createAdminSchoolFn,
  updateAdminSchoolFn,
  deleteAdminSchoolFn,
} from "@/api/admin.server";

interface SchoolItem {
  id: string;
  name: string;
  city: string;
  plan: string;
  renewal: string;
  students: number;
  seats: number;
  health: number;
  status: string;
}

export const Route = createFileRoute("/admin/schools")({
  head: () => ({
    meta: [
      { title: "Schools & Licenses · Syntax2Code Platform" },
      {
        name: "description",
        content: "Manage partner schools, licence tiers, seat usage and renewals.",
      },
      { property: "og:title", content: "Schools & Licenses · Syntax2Code Platform" },
      {
        property: "og:description",
        content: "Licence and subscription management across the network.",
      },
    ],
  }),
  loader: async () => {
    return await getAdminSchoolsFn();
  },
  component: AdminSchools,
});

const plans = ["All plans", "Starter", "Growth", "Enterprise"] as const;
const tiers = ["Starter", "Growth", "Enterprise"] as const;

type School = SchoolItem;

function AdminSchools() {
  const { schools: initialSchools } = Route.useLoaderData();
  const [list, setList] = useState<School[]>(initialSchools);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<(typeof plans)[number]>("All plans");
  const [add, setAdd] = useState(false);
  const [detail, setDetail] = useState<School | null>(null);
  const [form, setForm] = useState({ name: "", city: "", plan: "Growth", seats: "800" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rows = list.filter(
    (s) =>
      (plan === "All plans" || s.plan === plan) && s.name.toLowerCase().includes(q.toLowerCase()),
  );
  const planTone = (p: string): Tone =>
    p === "Enterprise" ? "violet" : p === "Growth" ? "sky" : "slate";

  const totalSeats = list.reduce((n, s) => n + s.seats, 0);
  const totalStudents = list.reduce((n, s) => n + s.students, 0);
  const seatUtil = totalSeats > 0 ? Math.round((totalStudents / totalSeats) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Schools & Licenses"
        subtitle={`${list.length} partner schools · ${totalSeats.toLocaleString()} seats contracted`}
        actions={
          <button
            onClick={() => setAdd(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add school
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Enterprise accounts"
          value={list.filter((s) => s.plan === "Enterprise").length}
          sub="Highest ARR tier"
          tone="violet"
        />
        <Stat
          label="Seat utilisation"
          value={`${seatUtil}%`}
          sub="Across all contracts"
          tone="emerald"
        />
        <Stat
          label="Renewals in 90 days"
          value={list.filter((s) => s.status === "Renewal due").length}
          sub="Requires CSM outreach"
          tone="amber"
        />
        <Stat
          label="At risk"
          value={list.filter((s) => s.status === "At risk").length}
          sub="Health below 50"
          tone="rose"
        />
      </div>

      <Panel title="Partner schools" description={`${rows.length} results`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search schools…"
              className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <FilterChips options={plans} value={plan} onChange={setPlan} />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <tr>
                {[
                  "School",
                  "City",
                  "Students",
                  "Plan",
                  "Seats",
                  "Health",
                  "Renewal",
                  "Status",
                  "",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.city}</td>
                  <td className="px-4 py-3 text-slate-600">{s.students.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Pill tone={planTone(s.plan)}>{s.plan}</Pill>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.seats.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="w-20">
                      <Bar
                        value={s.health}
                        tone={s.health >= 80 ? "emerald" : s.health >= 60 ? "indigo" : "amber"}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.renewal}</td>
                  <td className="px-4 py-3">
                    <Pill
                      tone={
                        s.status === "Active"
                          ? "emerald"
                          : s.status === "Renewal due"
                            ? "amber"
                            : "rose"
                      }
                    >
                      {s.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDetail(s)}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {add && (
        <Modal
          onClose={() => setAdd(false)}
          title="Add a partner school"
          subtitle="Provision a workspace, licence tier and admin invite."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="School name"
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm sm:col-span-2"
            />
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="City"
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            />
            <input
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: e.target.value })}
              placeholder="Seats"
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            />
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-medium text-slate-500">Licence tier</p>
              <FilterChips
                options={tiers}
                value={form.plan as (typeof tiers)[number]}
                onChange={(v) => setForm({ ...form, plan: v })}
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setAdd(false)}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={async () => {
                const name = form.name.trim();
                if (!name) {
                  toast.error("Please enter school name");
                  return;
                }
                setIsSubmitting(true);
                try {
                  const res = await createAdminSchoolFn({
                    data: {
                      name,
                      city: form.city.trim() || "—",
                      plan: form.plan,
                      seats: Number(form.seats) || 800,
                    },
                  });
                  if (res?.school) {
                    setList((l) => [res.school, ...l]);
                    setAdd(false);
                    setForm({ name: "", city: "", plan: "Growth", seats: "800" });
                    toast.success(`${res.school.name} provisioned`, {
                      description: `${form.plan} licence · admin invite emailed.`,
                    });
                  }
                } catch (err: unknown) {
                  toast.error("Failed to provision school", {
                    description: (err as Error).message,
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create school"}
            </button>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal
          onClose={() => setDetail(null)}
          title={detail.name}
          subtitle={`${detail.city} · ${detail.plan} licence · renews ${detail.renewal}`}
          wide
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Students"
              value={detail.students.toLocaleString()}
              sub={`${detail.seats.toLocaleString()} seats`}
              tone="sky"
            />
            <Stat
              label="Seat usage"
              value={`${detail.seats > 0 ? Math.round((detail.students / detail.seats) * 100) : 0}%`}
              sub="Contract utilisation"
              tone="emerald"
            />
            <Stat
              label="Account health"
              value={detail.health}
              sub={detail.status}
              tone={detail.health >= 80 ? "emerald" : detail.health >= 60 ? "amber" : "rose"}
            />
          </div>
          <div className="mt-5 space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Change licence tier</p>
              <FilterChips
                options={tiers}
                value={detail.plan as (typeof tiers)[number]}
                onChange={async (v) => {
                  setList((l) => l.map((s) => (s.id === detail.id ? { ...s, plan: v } : s)));
                  setDetail({ ...detail, plan: v });
                  const numId = parseInt(detail.id, 10);
                  if (!isNaN(numId)) {
                    await updateAdminSchoolFn({ data: { id: numId, plan: v } });
                  }
                  toast.success(`${detail.name} moved to ${v}`, {
                    description: "Billing updated from the next cycle.",
                  });
                }}
              />
            </div>
            <div className="rounded-xl border border-slate-200 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Usage this month</p>
              <p className="mt-1">
                Lessons served {(detail.students * 11).toLocaleString()} · projects submitted{" "}
                {(detail.students * 0.34).toFixed(0)} · certificates issued{" "}
                {(detail.students * 1.8).toFixed(0)}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
            <button
              onClick={async () => {
                const numId = parseInt(detail.id, 10);
                if (!isNaN(numId)) {
                  await deleteAdminSchoolFn({ data: numId });
                }
                setList((l) => l.filter((s) => s.id !== detail.id));
                setDetail(null);
                toast.success(`${detail.name} archived from network`);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-medium text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Archive school
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => toast.success("Renewal reminder sent to the account owner")}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50"
              >
                Send renewal reminder
              </button>
              <button
                onClick={async () => {
                  const newSeats = detail.seats + 200;
                  setList((l) =>
                    l.map((s) => (s.id === detail.id ? { ...s, seats: newSeats } : s)),
                  );
                  setDetail({ ...detail, seats: newSeats });
                  const numId = parseInt(detail.id, 10);
                  if (!isNaN(numId)) {
                    await updateAdminSchoolFn({ data: { id: numId, seats: newSeats } });
                  }
                  toast.success("Seats increased by 200", {
                    description: `${detail.name} · pro-rated invoice raised.`,
                  });
                }}
                className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Add 200 seats
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
