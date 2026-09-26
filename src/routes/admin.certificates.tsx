import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Plus, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";

interface CertTemplate {
  id: string;
  name: string;
  category?: string;
  accent?: string;
  status?: string;
  usage?: number;
  updated?: string;
}
interface IssuedCredential {
  id: string;
  holder: string;
  student: string;
  template: string;
  school: string;
  issued: string;
  status?: string;
}
const certificateTemplates: Array<CertTemplate> = [];
const issuedCredentials: Array<IssuedCredential> = [];
import { cn } from "@/client/lib/utils";

export const Route = createFileRoute("/admin/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates · Syntax2Code Platform" },
      {
        name: "description",
        content:
          "Design certificate templates, browse the issued credential registry and verify credential IDs.",
      },
      { property: "og:title", content: "Certificates · Syntax2Code Platform" },
      {
        property: "og:description",
        content: "Template designer and verifiable credential registry.",
      },
    ],
  }),
  component: AdminCertificates,
});

const tabs = ["Templates", "Issued registry", "Verification"] as const;
const accents = ["indigo", "teal", "amber", "violet"] as const;

function AdminCertificates() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Templates");
  const [templates, setTemplates] = useState(certificateTemplates);
  const [design, setDesign] = useState({
    name: "AI Literacy 2027 Refresh",
    accent: "indigo" as (typeof accents)[number],
    seal: true,
    signature: "Founder & CEO, Syntax2Code",
  });
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; msg: string; detail?: string }>(null);

  const rows = issuedCredentials.filter((c) =>
    (c.holder + c.id + c.school).toLowerCase().includes(q.toLowerCase()),
  );

  const accentClass = {
    indigo: "from-indigo-500 to-indigo-700",
    teal: "from-teal-500 to-teal-700",
    amber: "from-amber-400 to-amber-600",
    violet: "from-violet-500 to-violet-700",
  }[design.accent];

  return (
    <>
      <PageHeader
        title="Certificates"
        subtitle="38,420 credentials issued · every one publicly verifiable"
        actions={
          <button
            onClick={() => toast.success("New template created as draft")}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> New template
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Templates live"
          value={templates.filter((t) => t.status === "Live").length}
          sub={`${templates.length} total`}
          tone="violet"
        />
        <Stat
          label="Issued all time"
          value="38,420"
          sub="+2,140 this month"
          tone="emerald"
          icon={<BadgeCheck className="h-4 w-4" />}
        />
        <Stat label="Verifications" value="11,908" sub="Employers, parents, schools" tone="sky" />
        <Stat
          label="Revoked"
          value={issuedCredentials.filter((c) => c.status === "Revoked").length}
          sub="Integrity actions"
          tone="rose"
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      </div>

      <FilterChips options={tabs} value={tab} onChange={setTab} />

      {tab === "Templates" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Panel title="Template library" description="Used across paths, competitions and clubs">
            <div className="space-y-2.5">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {(t.usage ?? 0).toLocaleString()} issued · updated {t.updated}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={t.status === "Live" ? "emerald" : "amber"}>{t.status}</Pill>
                    <button
                      onClick={() => setDesign({ ...design, name: t.name })}
                      className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Open in designer
                    </button>
                    <button
                      onClick={() => {
                        setTemplates((l) =>
                          l.map((x) =>
                            x.id === t.id
                              ? { ...x, status: x.status === "Live" ? "Draft" : "Live" }
                              : x,
                          ),
                        );
                        toast(
                          t.status === "Live" ? `${t.name} unpublished` : `${t.name} is now live`,
                        );
                      }}
                      className="h-9 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      {t.status === "Live" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Template designer" description="Live preview">
            <div className={cn("rounded-2xl bg-gradient-to-br p-[2px]", accentClass)}>
              <div className="rounded-[14px] bg-white p-5 text-center">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                  Syntax2Code
                </p>
                <p className="mt-3 font-display text-lg font-semibold text-slate-900">
                  {design.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">This is to certify that</p>
                <p className="mt-2 font-display text-base font-semibold text-slate-800">
                  Aarav Sharma
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  has demonstrated mastery of the required competencies and standards.
                </p>
                {design.seal && (
                  <div
                    className={cn(
                      "mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-white",
                      accentClass,
                    )}
                  >
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                )}
                <p className="mt-3 text-[10px] text-slate-400">{design.signature}</p>
                <p className="mt-1 text-[10px] text-slate-400">S2C-2026-AX41K9</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <input
                value={design.name}
                onChange={(e) => setDesign({ ...design, name: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Accent</p>
                <FilterChips
                  options={accents}
                  value={design.accent}
                  onChange={(v) => setDesign({ ...design, accent: v })}
                />
              </div>
              <input
                value={design.signature}
                onChange={(e) => setDesign({ ...design, signature: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                Show verification seal
                <input
                  type="checkbox"
                  checked={design.seal}
                  onChange={(e) => setDesign({ ...design, seal: e.target.checked })}
                  className="h-4 w-4 accent-indigo-600"
                />
              </label>
              <button
                onClick={() => toast.success("Template saved", { description: design.name })}
                className="h-10 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save template
              </button>
            </div>
          </Panel>
        </div>
      )}

      {tab === "Issued registry" && (
        <Panel title="Issued credentials" description={`${rows.length} results`}>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by holder, school or credential ID…"
              className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-indigo-300"
            />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <tr>
                  {["Credential ID", "Holder", "School", "Template", "Issued", "Status", ""].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{c.holder}</td>
                    <td className="px-4 py-3 text-slate-500">{c.school}</td>
                    <td className="px-4 py-3 text-slate-600">{c.template}</td>
                    <td className="px-4 py-3 text-slate-500">{c.issued}</td>
                    <td className="px-4 py-3">
                      <Pill tone={c.status === "Valid" ? "emerald" : "rose"}>{c.status}</Pill>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          toast.success("Verification link copied", {
                            description: `s2cjunior.com/verify/${c.id}`,
                          })
                        }
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Copy link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "Verification" && (
        <Panel
          title="Credential verification simulator"
          description="What an employer or parent sees at s2cjunior.com/verify"
        >
          <div className="max-w-xl">
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="S2C-2026-AX41K9"
                className="h-11 flex-1 rounded-xl border border-slate-200 px-3 font-mono text-sm outline-none focus:border-indigo-300"
              />
              <button
                onClick={() => {
                  const hit = issuedCredentials.find((c) => c.id === code.trim());
                  if (!hit) setResult({ ok: false, msg: "No credential found with that ID" });
                  else if (hit.status === "Revoked")
                    setResult({
                      ok: false,
                      msg: "This credential has been revoked",
                      detail: `${hit.holder} · ${hit.template}`,
                    });
                  else
                    setResult({
                      ok: true,
                      msg: "Credential verified",
                      detail: `${hit.holder} · ${hit.template} · ${hit.school} · issued ${hit.issued}`,
                    });
                }}
                className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Verify
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Try S2C-2026-AX41K9 (valid) or S2C-2026-ZT19C4 (revoked).
            </p>
            {result && (
              <div
                className={cn(
                  "mt-4 rounded-2xl border p-4",
                  result.ok
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-rose-200 bg-rose-50/60",
                )}
              >
                <p className="text-sm font-semibold text-slate-900">{result.msg}</p>
                {result.detail && <p className="mt-1 text-xs text-slate-600">{result.detail}</p>}
              </div>
            )}
          </div>
        </Panel>
      )}
    </>
  );
}
