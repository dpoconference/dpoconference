import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { apiUpload } from "@/lib/upload";

export const Route = createFileRoute("/admin/jobs")({
  component: Page,
});

type Job = {
  id: string;
  title: string;
  organisation: string;
  location: string;
  sector?: string | null;
  experienceLevel?: string | null;
  employmentType?: string | null;
  workMode?: string | null;
  closesOn?: string | null;
  description: string;
  howToApply?: string;
  coverUrl?: string | null;
  attachmentUrl?: string | null;
  isPublished: boolean;
  isArchived?: boolean;
  membershipRequiredToApply?: boolean;
  postedBy?: { email: string; firstName: string; lastName: string };
  _count: { applications: number };
};

const emptyForm = {
  id: "",
  title: "",
  organisation: "",
  location: "",
  sector: "",
  experienceLevel: "",
  employmentType: "",
  workMode: "",
  closesOn: "",
  description: "",
  howToApply: "",
  coverUrl: "",
  attachmentUrl: "",
  membershipRequiredToApply: false,
  isPublished: true,
};

function Page() {
  const { hasPermission } = useAuth();
  const can = hasPermission("cms.manage");
  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<"cover" | "pdf" | null>(null);

  const q = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: () => apiGet<Job[]>("/admin/jobs"),
    enabled: can,
  });

  if (!can) return <p className="text-sm text-muted-foreground">You need cms.manage to publish jobs.</p>;
  if (q.isPending) return <Skeleton className="h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" subtitle="Create, edit and publish vacancies with JD, how-to-apply, images and PDF packs." />

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-3 rounded-2xl border border-border bg-card p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              await apiPost("/admin/jobs", {
                id: form.id || undefined,
                title: form.title,
                organisation: form.organisation,
                location: form.location,
                sector: form.sector || undefined,
                experienceLevel: form.experienceLevel || undefined,
                employmentType: form.employmentType || undefined,
                workMode: form.workMode || undefined,
                closesOn: form.closesOn ? new Date(form.closesOn).toISOString() : undefined,
                description: form.description,
                howToApply: form.howToApply,
                coverUrl: form.coverUrl || undefined,
                attachmentUrl: form.attachmentUrl || undefined,
                membershipRequiredToApply: form.membershipRequiredToApply,
                isPublished: form.isPublished,
              });
              notify.success(form.id ? "Job updated." : "Job created.");
              setForm(emptyForm);
              await q.refetch();
            } finally {
              setLoading(false);
            }
          }}
        >
          <h3 className="font-semibold">{form.id ? "Edit job" : "New job"}</h3>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
            placeholder="Job title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded-md border px-3 py-2 text-sm"
              required
              placeholder="Organisation"
              value={form.organisation}
              onChange={(e) => setForm({ ...form, organisation: e.target.value })}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              required
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="Sector"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="Employment type"
              value={form.employmentType}
              onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="Experience level"
              value={form.experienceLevel}
              onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="Work mode"
              value={form.workMode}
              onChange={(e) => setForm({ ...form, workMode: e.target.value })}
            />
          </div>
          <label className="text-xs text-muted-foreground">
            Closes on
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.closesOn}
              onChange={(e) => setForm({ ...form, closesOn: e.target.value })}
            />
          </label>
          <textarea
            className="min-h-28 w-full rounded-md border px-3 py-2 text-sm"
            required
            placeholder="Job description (JD)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <textarea
            className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="How to apply"
            value={form.howToApply}
            onChange={(e) => setForm({ ...form, howToApply: e.target.value })}
          />
          <div className="space-y-2">
            {form.coverUrl ? <img src={form.coverUrl} alt="" className="h-28 w-full rounded-lg border object-cover" /> : null}
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading("cover");
                try {
                  const up = await apiUpload(file, "ndpo/jobs");
                  setForm((f) => ({ ...f, coverUrl: up.url }));
                  notify.success("Cover uploaded.");
                } finally {
                  setUploading(null);
                }
              }}
            />
            <Button type="button" size="sm" variant="outline" loading={uploading === "cover"} onClick={() => coverRef.current?.click()}>
              Upload cover image
            </Button>
          </div>
          <div className="space-y-2">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Attachment URL (PDF)"
              value={form.attachmentUrl}
              onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
            />
            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading("pdf");
                try {
                  const up = await apiUpload(file, "ndpo/jobs");
                  setForm((f) => ({ ...f, attachmentUrl: up.url }));
                  notify.success("Attachment uploaded.");
                } finally {
                  setUploading(null);
                }
              }}
            />
            <Button type="button" size="sm" variant="outline" loading={uploading === "pdf"} onClick={() => pdfRef.current?.click()}>
              Upload PDF / pack
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.membershipRequiredToApply}
              onChange={(e) => setForm({ ...form, membershipRequiredToApply: e.target.checked })}
            />
            Members only to apply
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            Published
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={loading}>
              {form.id ? "Update job" : "Create & publish"}
            </Button>
            {form.id && (
              <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
                Cancel edit
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          {(q.data ?? []).map((job) => (
            <div key={job.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-muted-foreground">
                    {job.organisation} · {job.location} · {job._count.applications} applications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {job.postedBy ? `${job.postedBy.firstName} ${job.postedBy.lastName}` : "Admin"} ·{" "}
                    {job.isPublished ? "Published" : "Unpublished"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm({
                        id: job.id,
                        title: job.title,
                        organisation: job.organisation,
                        location: job.location,
                        sector: job.sector ?? "",
                        experienceLevel: job.experienceLevel ?? "",
                        employmentType: job.employmentType ?? "",
                        workMode: job.workMode ?? "",
                        closesOn: job.closesOn ? job.closesOn.slice(0, 10) : "",
                        description: job.description,
                        howToApply: job.howToApply ?? "",
                        coverUrl: job.coverUrl ?? "",
                        attachmentUrl: job.attachmentUrl ?? "",
                        membershipRequiredToApply: job.membershipRequiredToApply ?? false,
                        isPublished: job.isPublished,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={job.isPublished ? "outline" : "default"}
                    onClick={() =>
                      void apiPost(`/admin/jobs/${job.id}/publish`, { isPublished: !job.isPublished }).then(() => {
                        notify.success(job.isPublished ? "Job unpublished." : "Job published.");
                        void q.refetch();
                      })
                    }
                  >
                    {job.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  {!job.isArchived ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void apiPatch(`/admin/jobs/${job.id}/archive`)
                          .then(() => {
                            notify.success("Job archived.");
                            void q.refetch();
                          })
                          .catch((err) => notify.error(err instanceof Error ? err.message : "Archive failed."))
                      }
                    >
                      Archive
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {(q.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No job postings yet.</p>}
        </div>
      </div>
    </div>
  );
}
