import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LifeBuoy, CheckCircle2, Clock, MessageSquare, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import { Button } from "@/client/components/ui/button";

interface SupportRequest {
  id: string;
  studentName: string;
  className: string;
  issue: string;
  tag: "Syntax Error" | "Loop Logic" | "Behind Pace" | "Advanced Inquiry";
  time: string;
  status: "open" | "in_progress" | "resolved";
}

const initialRequests: SupportRequest[] = [
  {
    id: "sup-1",
    studentName: "Aarav Gupta",
    className: "Grade 8A Python",
    issue: "IndentationError inside while loop block during Prime Number Filter challenge.",
    tag: "Syntax Error",
    time: "10 mins ago",
    status: "open",
  },
  {
    id: "sup-2",
    studentName: "Meera Nair",
    className: "Grade 8A Python",
    issue: "Stuck on infinite recursive function call when calculating factorial.",
    tag: "Loop Logic",
    time: "25 mins ago",
    status: "in_progress",
  },
  {
    id: "sup-3",
    studentName: "Rohan Patel",
    className: "Grade 7B Web Creator",
    issue: "CSS flexbox layout alignment not centering items on mobile preview viewport.",
    tag: "Syntax Error",
    time: "1 hour ago",
    status: "open",
  },
  {
    id: "sup-4",
    studentName: "Ananya Iyer",
    className: "Grade 8A Python",
    issue: "Requesting guidance on implementing Dijkstra algorithm for extra credit.",
    tag: "Advanced Inquiry",
    time: "2 hours ago",
    status: "resolved",
  },
];

export const Route = createFileRoute("/teacher/support")({
  head: () => ({
    meta: [
      { title: "Student Support & Help Requests · Syntax2Code" },
      {
        name: "description",
        content:
          "Track student syntax roadblocks, intervention queues, and 1-on-1 support tickets.",
      },
    ],
  }),
  component: TeacherSupportPage,
});

function TeacherSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>(initialRequests);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");

  const updateStatus = (id: string, newStatus: "open" | "in_progress" | "resolved") => {
    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req)));
    toast.success(`Support request marked as ${newStatus.replace("_", " ")}`);
  };

  const filteredRequests =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Student Support & Interventions"
        subtitle="Address live coding roadblocks, syntax help tickets, and targeted intervention requests from your students."
        actions={
          <div className="flex items-center gap-2">
            <Pill tone="amber">
              <span className="flex items-center gap-1.5 font-medium">
                <LifeBuoy className="h-3.5 w-3.5" />
                {requests.filter((r) => r.status === "open").length} Active Help Tickets
              </span>
            </Pill>
          </div>
        }
      />

      {/* FILTER TABS */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {(["all", "open", "in_progress", "resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
              filter === tab
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* TICKETS LIST */}
      <div className="space-y-3">
        {filteredRequests.map((req) => (
          <Panel
            key={req.id}
            className="p-4 bg-white border border-slate-200 hover:shadow-sm transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-900">{req.studentName}</h3>
                  <span className="text-xs text-slate-500 font-medium">({req.className})</span>
                  <Pill
                    tone={
                      req.tag === "Syntax Error"
                        ? "rose"
                        : req.tag === "Loop Logic"
                          ? "amber"
                          : req.tag === "Advanced Inquiry"
                            ? "violet"
                            : "slate"
                    }
                  >
                    {req.tag}
                  </Pill>
                </div>
                <p className="text-xs text-slate-700 font-medium">{req.issue}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {req.time}
                  </span>
                  <span className="capitalize text-slate-600 font-semibold">
                    Status: {req.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {req.status !== "in_progress" && req.status !== "resolved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatus(req.id, "in_progress")}
                    className="text-xs"
                  >
                    Assist Student
                  </Button>
                )}
                {req.status !== "resolved" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus(req.id, "resolved")}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Resolve
                  </Button>
                )}
                {req.status === "resolved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatus(req.id, "open")}
                    className="text-xs text-slate-500"
                  >
                    Reopen
                  </Button>
                )}
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
