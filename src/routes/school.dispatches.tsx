import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Mail, CheckCircle2, Clock, Send, ShieldCheck, Filter, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { Button } from "@/client/components/ui/button";

interface DispatchLog {
  id: string;
  recipientParent: string;
  studentName: string;
  grade: string;
  subject: string;
  dispatchedAt: string;
  status: "Delivered" | "Read" | "Pending";
}

const initialDispatches: DispatchLog[] = [
  {
    id: "disp-101",
    recipientParent: "mr.gupta@example.com",
    studentName: "Aarav Gupta",
    grade: "Grade 8A",
    subject: "Weekly AI & Python Progress Digest",
    dispatchedAt: "Today, 9:00 AM",
    status: "Read",
  },
  {
    id: "disp-102",
    recipientParent: "s.nair@example.com",
    studentName: "Meera Nair",
    grade: "Grade 8A",
    subject: "Weekly AI & Python Progress Digest",
    dispatchedAt: "Today, 9:00 AM",
    status: "Delivered",
  },
  {
    id: "disp-103",
    recipientParent: "vikram.patel@example.com",
    studentName: "Rohan Patel",
    grade: "Grade 7B",
    subject: "Module 2 Web Development Milestones",
    dispatchedAt: "Yesterday, 4:15 PM",
    status: "Read",
  },
  {
    id: "disp-104",
    recipientParent: "priya.iyer@example.com",
    studentName: "Ananya Iyer",
    grade: "Grade 8A",
    subject: "Weekly AI & Python Progress Digest",
    dispatchedAt: "Today, 9:00 AM",
    status: "Pending",
  },
];

export const Route = createFileRoute("/school/dispatches")({
  head: () => ({
    meta: [
      { title: "Parent Dispatches & Communications · Syntax2Code" },
      {
        name: "description",
        content:
          "Automated parent performance digests, delivery telemetry, and broadcast dispatches.",
      },
    ],
  }),
  component: SchoolDispatchesPage,
});

function SchoolDispatchesPage() {
  const [dispatches, setDispatches] = useState<DispatchLog[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("s2c_school_parent_dispatches");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return initialDispatches;
  });

  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("s2c_school_parent_dispatches", JSON.stringify(dispatches));
    }
  }, [dispatches]);

  const handleBroadcastDigest = () => {
    setIsSending(true);
    setTimeout(() => {
      const newDispatch: DispatchLog = {
        id: `disp-${Date.now()}`,
        recipientParent: "all-parents@globaltech.edu",
        studentName: "All Active Students (148)",
        grade: "All Grades (6–12)",
        subject: "Automated School-Wide Bi-Weekly Coding Digest",
        dispatchedAt: "Just now",
        status: "Delivered",
      };
      setDispatches([newDispatch, ...dispatches]);
      setIsSending(false);
      toast.success("Broadcast dispatched successfully!", {
        description: "Sent progress summaries to 148 verified parent email addresses.",
      });
    }, 800);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Automated Parent Dispatches"
        subtitle="Manage automated weekly coding updates, grade reports, and student growth digests delivered to parents."
        actions={
          <Button onClick={handleBroadcastDigest} disabled={isSending}>
            <Send className="h-4 w-4 mr-1.5" />
            {isSending ? "Dispatching..." : "Trigger Parent Broadcast"}
          </Button>
        }
      />

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Panel className="p-4 bg-white border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Dispatched
              </p>
              <p className="text-xl font-bold text-slate-900">{dispatches.length * 37 + 104}</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-4 bg-white border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Open / Read Rate
              </p>
              <p className="text-xl font-bold text-slate-900">92.4%</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-4 bg-white border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Auto-Schedule
              </p>
              <p className="text-xl font-bold text-slate-900">Every Friday 4 PM</p>
            </div>
          </div>
        </Panel>
      </div>

      {/* DISPATCH TELEMETRY TABLE */}
      <Panel
        title="Recent Parent Dispatch Activity"
        description="Real-time log of automated messages sent to registered guardians"
        className="p-0 overflow-hidden bg-white border border-slate-200"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="py-3 px-4">Student & Grade</th>
                <th className="py-3 px-4">Guardian Contact</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatches.map((disp) => (
                <tr key={disp.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{disp.studentName}</p>
                    <p className="text-xs text-slate-500">{disp.grade}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">
                    {disp.recipientParent}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-800">{disp.subject}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{disp.dispatchedAt}</td>
                  <td className="py-3 px-4">
                    <Pill
                      tone={
                        disp.status === "Read"
                          ? "emerald"
                          : disp.status === "Delivered"
                            ? "violet"
                            : "amber"
                      }
                    >
                      {disp.status}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
