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
            {open.fileUrl ? (
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
                  onClick={() =>
                    toast.success("Download started", { description: `${open.credential}.pdf` })
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  onClick={() => toast.success("Share link copied to clipboard")}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
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
