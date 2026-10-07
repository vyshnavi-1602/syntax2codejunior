import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BadgeCheck, Plus, Search, ShieldAlert, Sparkles, Award } from "lucide-react";
import { toast } from "sonner";
import { FilterChips, PageHeader, Panel, Pill, Stat } from "@/client/components/app/primitives";
import { cn } from "@/client/lib/utils";
import { getAdminCertificatesFn, verifyAdminCredentialFn } from "@/api/admin.server";

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
  loader: async () => {
    return await getAdminCertificatesFn();
  },
  component: AdminCertificates,
});

const tabs = ["Templates", "Issued registry", "Verification"] as const;
const accents = ["indigo", "teal", "amber", "violet"] as const;

function AdminCertificates() {
  const { templates: initialTemplates, issuedCredentials: initialIssued } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Templates");
  const [templates, setTemplates] = useState<CertTemplate[]>(initialTemplates);
  const [issued, setIssued] = useState<IssuedCredential[]>(initialIssued);
  const [design, setDesign] = useState({
    name: "AI Literacy 2027 Refresh",
    accent: "indigo" as (typeof accents)[number],
    seal: true,
    signature: "Founder & CEO, Syntax2Code",
  });
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; msg: string; detail?: string }>(null);

  // New Template Modal state
  const [newTemplateModal, setNewTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "Curriculum Track",
    accent: "indigo" as (typeof accents)[number],
    signature: "Academic Director, Syntax2Code Global",
  });

  // Load persisted templates
  useEffect(() => {
    try {
      const saved = localStorage.getItem("s2c_admin_custom_cert_templates");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const fresh = parsed.filter((p: CertTemplate) => !existingIds.has(p.id));
            return [...fresh, ...prev];
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    const created: CertTemplate = {
      id: `tmpl-${Date.now()}`,
      name: newTemplate.name.trim(),
      category: newTemplate.category,
      accent: newTemplate.accent,
      status: "Live",
      usage: 0,
      updated: "Just now",
    };

    const updatedList = [created, ...templates];
    setTemplates(updatedList);
    setDesign({
      name: created.name,
      accent: newTemplate.accent,
      seal: true,
      signature: newTemplate.signature,
    });

    try {
      localStorage.setItem("s2c_admin_custom_cert_templates", JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    setNewTemplateModal(false);
    setNewTemplate({
      name: "",
      category: "Curriculum Track",
      accent: "indigo",
      signature: "Academic Director, Syntax2Code Global",
    });
    toast.success(`Template "${created.name}" created & published!`, {
      description: "Now active in template library and designer preview.",
    });
  };

  const rows = issued.filter((c) =>
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
        subtitle="38,420 credentials issued · every one publicly verifiable on the Syntax2Code registry"
        actions={
          <button
            onClick={() => setNewTemplateModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> New template
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Templates live"
          value={templates.filter((t) => t.status === "Live").length}
          sub={`${templates.length} total available`}
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
          value={issued.filter((c) => c.status === "Revoked").length}
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
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      {t.category && <Pill tone="sky">{t.category}</Pill>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(t.usage ?? 0).toLocaleString()} issued · updated {t.updated}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={t.status === "Live" ? "emerald" : "amber"}>{t.status}</Pill>
                    <button
                      onClick={() =>
                        setDesign({
                          ...design,
                          name: t.name,
                          accent: (t.accent as (typeof accents)[number]) || "indigo",
                        })
                      }
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
                    >
                      Open in designer
                    </button>
                    <button
                      onClick={() => {
                        const updated = templates.map((x) =>
                          x.id === t.id
                            ? { ...x, status: x.status === "Live" ? "Draft" : "Live" }
                            : x,
                        );
                        setTemplates(updated);
                        try {
                          localStorage.setItem(
                            "s2c_admin_custom_cert_templates",
                            JSON.stringify(updated),
                          );
                        } catch {
                          // ignore
                        }
                        toast(
                          t.status === "Live" ? `${t.name} unpublished` : `${t.name} is now live`,
                        );
                      }}
                      className="h-9 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                    >
                      {t.status === "Live" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Template designer" description="Live verifiable certificate preview">
            <div className={cn("rounded-2xl bg-gradient-to-br p-[2px] shadow-sm", accentClass)}>
              <div className="rounded-[14px] bg-white p-5 text-center">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                  Syntax2Code Verifiable Credential
                </p>
                <p className="mt-3 font-display text-lg font-bold text-slate-900 leading-snug">
                  {design.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">This is to certify that</p>
                <p className="mt-2 font-display text-base font-semibold text-slate-800">
                  Aarav Sharma
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  has demonstrated mastery of the required competencies, automated test suites, and
                  standards.
                </p>
                {design.seal && (
                  <div
                    className={cn(
                      "mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm",
                      accentClass,
                    )}
                  >
                    <BadgeCheck className="h-6 w-6" />
                  </div>
                )}
                <p className="mt-3 text-[10px] font-medium text-slate-500">{design.signature}</p>
                <p className="mt-1 font-mono text-[10px] text-slate-400">S2C-2026-AX41K9</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Certificate Title</label>
                <input
                  value={design.name}
                  onChange={(e) => setDesign({ ...design, name: e.target.value })}
                  className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-700">Color Palette</p>
                <FilterChips
                  options={accents}
                  value={design.accent}
                  onChange={(v) => setDesign({ ...design, accent: v })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Official Signatory</label>
                <input
                  value={design.signature}
                  onChange={(e) => setDesign({ ...design, signature: e.target.value })}
                  className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-700 shadow-xs">
                <span>Display Cryptographic Seal</span>
                <input
                  type="checkbox"
                  checked={design.seal}
                  onChange={(e) => setDesign({ ...design, seal: e.target.checked })}
                  className="h-4 w-4 accent-indigo-600"
                />
              </label>
            </div>
          </Panel>
        </div>
      )}

      {tab === "Issued registry" && (
        <Panel
          title="Issued credentials"
          description={`${rows.length} results in platform ledger`}
          action={
            <button
              onClick={() => {
                const rowsData = [
                  ["Credential ID", "Holder", "School", "Template", "Issued Date", "Status"],
                  ...issued.map((c) => [
                    c.id,
                    c.holder,
                    c.school,
                    c.template,
                    c.issued,
                    c.status || "Valid",
                  ]),
                ];
                const csvContent =
                  "data:text/csv;charset=utf-8," +
                  rowsData
                    .map((row) => row.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
                    .join("\n");
                const link = document.createElement("a");
                link.setAttribute("href", encodeURI(csvContent));
                link.setAttribute("download", "syntax2code_credential_ledger.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Credential registry exported to CSV");
              }}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              Export Ledger (CSV)
            </button>
          }
        >
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by holder, school or credential ID…"
              className="h-10 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-indigo-300 shadow-xs"
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
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => {
                            const newStatus = c.status === "Valid" ? "Revoked" : "Valid";
                            setIssued((prev) =>
                              prev.map((item) =>
                                item.id === c.id ? { ...item, status: newStatus } : item,
                              ),
                            );
                            toast.info(`Credential ${c.id} status set to ${newStatus}`);
                          }}
                          className={cn(
                            "text-xs font-semibold hover:underline",
                            c.status === "Valid" ? "text-rose-600" : "text-emerald-600",
                          )}
                        >
                          {c.status === "Valid" ? "Revoke" : "Reinstate"}
                        </button>
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
                      </div>
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
          description="Public verification simulator for employers, parents, and schools"
        >
          <div className="max-w-xl">
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. S2C-2026-AX41K9"
                className="h-11 flex-1 rounded-xl border border-slate-200 px-3 font-mono text-sm outline-none focus:border-indigo-300 shadow-xs"
              />
              <button
                onClick={async () => {
                  const searchCode = code.trim();
                  if (!searchCode) {
                    toast.error("Please enter a credential ID");
                    return;
                  }
                  const hit = issued.find((c) => c.id.toUpperCase() === searchCode.toUpperCase());
                  if (hit) {
                    if (hit.status === "Revoked") {
                      setResult({
                        ok: false,
                        msg: "This credential has been revoked",
                        detail: `${hit.holder} · ${hit.template}`,
                      });
                    } else {
                      setResult({
                        ok: true,
                        msg: "Credential verified against Syntax2Code ledger",
                        detail: `${hit.holder} · ${hit.template} · ${hit.school} · issued ${hit.issued}`,
                      });
                    }
                    return;
                  }
                  try {
                    const res = await verifyAdminCredentialFn({ data: searchCode });
                    setResult(res);
                  } catch {
                    setResult({
                      ok: false,
                      msg: "No credential found with that ID in platform ledger",
                    });
                  }
                }}
                className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Verify
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Try <strong className="text-slate-600">S2C-2026-AX41K9</strong> (valid) or{" "}
              <strong className="text-slate-600">S2C-2026-ZT19C4</strong> (revoked).
            </p>
            {result && (
              <div
                className={cn(
                  "mt-4 rounded-2xl border p-4 shadow-xs",
                  result.ok
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-rose-200 bg-rose-50/60",
                )}
              >
                <div className="flex items-center gap-2">
                  <Award
                    className={cn("h-4 w-4", result.ok ? "text-emerald-600" : "text-rose-600")}
                  />
                  <p className="text-sm font-semibold text-slate-900">{result.msg}</p>
                </div>
                {result.detail && <p className="mt-1 text-xs text-slate-600">{result.detail}</p>}
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* New Template Modal */}
      {newTemplateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setNewTemplateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Create Certificate Template
                </h3>
                <p className="text-xs text-slate-500">
                  Design credentials for classes and tournaments
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateTemplate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Template Name</label>
                <input
                  required
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g. Master of Algorithmic Python"
                  className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400"
                >
                  <option value="Curriculum Track">Curriculum Track</option>
                  <option value="Championship & Tournaments">Championship & Tournaments</option>
                  <option value="Coding Club Specialization">Coding Club Specialization</option>
                  <option value="Honor Roll & Excellence">Honor Roll & Excellence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Color Accent
                </label>
                <FilterChips
                  options={accents}
                  value={newTemplate.accent}
                  onChange={(v) => setNewTemplate({ ...newTemplate, accent: v })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Default Signatory
                </label>
                <input
                  value={newTemplate.signature}
                  onChange={(e) => setNewTemplate({ ...newTemplate, signature: e.target.value })}
                  placeholder="Academic Director, Syntax2Code Global"
                  className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewTemplateModal(false)}
                  className="h-9.5 rounded-xl border border-slate-200 px-4 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Save & Publish Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
