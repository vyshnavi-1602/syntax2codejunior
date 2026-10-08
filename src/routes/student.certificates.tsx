import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Award, BadgeCheck, Download, Share2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/client/components/app/primitives";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/client/components/ui/dialog";

import { getStudentBadgesFn, addCertificateFn } from "@/api/student.server";
import { useSession } from "@/client/lib/session";
import { printIsolatedHtml } from "@/client/lib/school-reports";

export const Route = createFileRoute("/student/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates · Syntax2Code" },
      {
        name: "description",
        content:
          "View, verify and download your Syntax2Code certificates with unique credential IDs.",
      },
      { property: "og:title", content: "Certificates · Syntax2Code" },
      {
        property: "og:description",
        content: "Verified certificates with credential IDs you can share.",
      },
    ],
  }),
  loader: async () => {
    return await getStudentBadgesFn();
  },
  component: CertificatesPage,
});

function CertificatesPage() {
  const router = useRouter();
  const certificates = Route.useLoaderData();
  const { user } = useSession();
  const [open, setOpen] = useState<(typeof certificates)[number] | null>(null);
  const [verifyId, setVerifyId] = useState("");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadIssuer, setUploadIssuer] = useState("");
  const [uploadFile, setUploadFile] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <PageHeader
        title="Certificates"
        subtitle="Every certificate carries a unique credential ID that schools and parents can verify."
        actions={
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">
                <UploadCloud className="h-4 w-4" /> Add Certificate
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload External Certificate</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Certificate Name</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Python for Beginners"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Issuer (Organization)
                  </label>
                  <input
                    type="text"
                    value={uploadIssuer}
                    onChange={(e) => setUploadIssuer(e.target.value)}
                    placeholder="e.g. Coursera"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Certificate File</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg"
                    onChange={handleFileChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!uploadTitle.trim() || !uploadIssuer.trim() || !uploadFile) {
                      toast.error("Please enter a name, issuer, and attach a file");
                      return;
                    }

                    try {
                      await addCertificateFn({
                        data: { title: uploadTitle, issuer: uploadIssuer, fileUrl: uploadFile },
                      });
                      toast.success("Certificate uploaded successfully!");
                      setIsUploadOpen(false);
                      setUploadTitle("");
                      setUploadIssuer("");
                      setUploadFile(null);
                      router.invalidate();
                    } catch (error) {
                      toast.error("Failed to upload certificate");
                    }
                  }}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Upload
                </button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {certificates.map((c) => (
          <button
            key={c.id}
            onClick={() => setOpen(c)}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 overflow-hidden">
                {c.fileUrl ? (
                  c.fileUrl.startsWith("data:application/pdf") ? (
                    <Award className="h-5 w-5" />
                  ) : (
                    <img src={c.fileUrl} alt="Certificate" className="h-full w-full object-cover" />
                  )
                ) : (
                  <Award className="h-5 w-5" />
                )}
              </span>
              <Pill tone="emerald">{c.grade}</Pill>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{c.title}</p>
            <p className="mt-1 text-xs text-slate-500">Issued {c.issued}</p>
            <p className="mt-2 font-mono text-[11px] text-slate-400">{c.credential}</p>
          </button>
        ))}
      </div>

      <Panel
        title="Verify a credential"
        description="Anyone can check a certificate's authenticity with its ID"
      >
        <div className="flex flex-wrap gap-2">
          <input
            value={verifyId}
            onChange={(e) => setVerifyId(e.target.value)}
            placeholder="e.g. S2C-PY2-8A-10421"
            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            onClick={() => {
              const found = certificates.find(
                (c) => c.credential.toLowerCase() === verifyId.trim().toLowerCase(),
              );
              if (found)
                toast.success("Credential verified ✓", {
                  description: `${found.title} · issued ${found.issued} to ${user?.name || "Aarav Sharma"}.`,
                });
              else
                toast("No match found", { description: "Check the credential ID and try again." });
            }}
            className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Verify
          </button>
        </div>
      </Panel>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {open.fileUrl &&
            (open.fileUrl.startsWith("data:application/pdf;") ||
              open.fileUrl.startsWith("data:image/png;") ||
              open.fileUrl.startsWith("data:image/jpeg;") ||
              open.fileUrl.startsWith("data:image/webp;") ||
              open.fileUrl.startsWith("https://")) ? (
              <div className="relative flex-1 overflow-auto bg-slate-100/50 p-4 flex items-center justify-center">
                {open.fileUrl.startsWith("data:application/pdf") ? (
                  <object
                    data={open.fileUrl}
                    type="application/pdf"
                    className="w-full h-[60vh] rounded-lg shadow-sm border border-slate-200"
                  >
                    <p>
                      It appears you don't have a PDF plugin for this browser.{" "}
                      <a href={open.fileUrl} download>
                        Click here to download the PDF file.
                      </a>
                    </p>
                  </object>
                ) : (
                  <img
                    src={open.fileUrl}
                    alt="External Certificate"
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm border border-slate-200"
                  />
                )}
              </div>
            ) : (
              <div className="relative flex-1 border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-teal-50 px-10 py-12 text-center">
                <p className="text-xs font-semibold tracking-[0.3em] text-indigo-600 uppercase">
                  Certificate of Achievement
                </p>
                <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-900">
                  {open.title}
                </h3>
                <p className="mt-4 text-sm text-slate-500">awarded to</p>
                <p className="font-display mt-1 text-2xl font-semibold text-slate-900">
                  {user?.name || "Aarav Sharma"}
                </p>
                <p className="mt-4 text-xs text-slate-500">
                  {user?.subtitle || "Grade 8A"} ·{" "}
                  {user?.school || "Greenfield International School"} · Issued {open.issued}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                  {open.skills.map((s) => (
                    <Pill key={s} tone="violet">
                      {s}
                    </Pill>
                  ))}
                </div>
                <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50/50 py-2 px-4 rounded-full w-fit mx-auto">
                  <BadgeCheck className="h-4 w-4" /> Verified credential · {open.credential}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <p className="text-xs font-medium text-slate-500">
                Issued by{" "}
                <span className="text-slate-700">{open.fileUrl ? open.title : open.issuer}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificate of Achievement - ${open.title}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: "Georgia", serif; color: #1e1b4b; margin: 0; padding: 32px; background: #fff; text-align: center; }
    .border-outer { border: 8px double #4f46e5; padding: 24px; border-radius: 12px; background: #faf5ff; }
    .border-inner { border: 2px solid #c7d2fe; padding: 32px 24px; border-radius: 8px; background: #ffffff; }
    .logo { font-size: 13px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; color: #4338ca; }
    h1 { font-size: 32px; margin: 14px 0 6px 0; color: #1e1b4b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .tagline { font-size: 13px; color: #64748b; font-style: italic; }
    .awardee-label { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; margin-top: 24px; }
    .awardee-name { font-size: 30px; font-weight: bold; color: #312e81; margin: 6px 0; text-decoration: underline; text-decoration-color: #6366f1; text-underline-offset: 6px; }
    .course-text { font-size: 14px; color: #475569; max-width: 620px; margin: 12px auto; line-height: 1.6; }
    .credential-box { margin-top: 24px; display: inline-block; padding: 8px 16px; background: #e0e7ff; border-radius: 6px; font-family: monospace; font-size: 12px; color: #3730a3; font-weight: bold; }
    .footer { margin-top: 36px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 32px; font-size: 12px; color: #4b5563; font-family: -apple-system, sans-serif; }
    .signature { border-top: 1px solid #94a3b8; width: 170px; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="border-outer">
    <div class="border-inner">
      <div class="logo">Syntax2Code Junior Foundation</div>
      <h1>Certificate of Achievement</h1>
      <div class="tagline">Official Computer Science & AI Accreditation</div>

      <div class="awardee-label">This certificate is proudly awarded to</div>
      <div class="awardee-name">${user?.name || "Aarav Sharma"}</div>

      <div class="course-text">
        For successfully completing all interactive laboratory modules, test suites, and capstone challenge requirements for <strong>${open.title}</strong> with distinction.
      </div>

      <div class="credential-box">
        Verified Credential ID: ${open.credential} · Issued: ${open.issued}
      </div>

      <div class="footer">
        <div class="signature">
          <strong>Academic Director</strong><br>
          Syntax2Code Global Council
        </div>
        <div style="font-size: 11px; color: #6b7280;">
          Verify at syntax2code.org/verify<br>
          ISO/IEC 17024 Standard
        </div>
        <div class="signature">
          <strong>Head of Faculty</strong><br>
          ${user?.school || "Greenfield International School"}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
                    printIsolatedHtml(html);
                    toast.success("Opening printable certificate…");
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" /> Download (PDF)
                </button>
                <button
                  onClick={async () => {
                    const url = `https://syntax2code.org/verify/${open.credential}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      toast.success("Verification link copied to clipboard!", { description: url });
                    } catch {
                      toast.success("Verification link ready", { description: url });
                    }
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share Link
                </button>
                <button
                  onClick={() => setOpen(null)}
                  className="h-9 rounded-lg px-3 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
