import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { apiUpload } from "@/lib/upload";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/learning")({
  component: Page,
});

const FALLBACK_AUDIENCES = [
  { value: "ALL", label: "All members" },
  { value: "associate", label: "Associate" },
  { value: "professional", label: "Professional" },
  { value: "corporate", label: "Corporate" },
  { value: "student", label: "Student" },
  { value: "fellow", label: "Fellow" },
];

type LearningAsset = {
  id: string;
  title: string;
  summary: string;
  bodyHtml?: string | null;
  coverUrl?: string | null;
  fileUrl: string;
  mimeType?: string | null;
  audience: string;
  isPublished: boolean;
};

type Category = { slug: string; name: string };

const emptyForm = {
  id: "",
  title: "",
  summary: "",
  bodyHtml: "",
  coverUrl: "",
  fileUrl: "",
  mimeType: "",
  audience: "ALL",
  isPublished: false,
};

function Page() {
  const { hasPermission } = useAuth();
  const can = hasPermission("cms.manage");
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const assets = useQuery({
    queryKey: ["admin-learning-assets"],
    queryFn: () => apiGet<LearningAsset[]>("/admin/learning-assets"),
    enabled: can,
  });

  const categories = useQuery({
    queryKey: ["public-membership-categories"],
    queryFn: () =>
      apiGet<Category[]>("/public/membership-categories").catch(() => [] as Category[]),
    enabled: can,
  });

  const audienceOptions = [
    { value: "ALL", label: "All members" },
    ...((categories.data?.length
      ? categories.data.map((c) => ({ value: c.slug, label: c.name }))
      : FALLBACK_AUDIENCES.filter((a) => a.value !== "ALL")) as { value: string; label: string }[]),
  ];

  if (!can) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need cms.manage permission to manage learning assets.
      </div>
    );
  }

  if (assets.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Learning"
        subtitle="Publish view-only LMS assets for members by audience category."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-3 rounded-2xl border border-border bg-card p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.fileUrl) {
              notify.error("Upload a learning file first.");
              return;
            }
            setLoading(true);
            try {
              const body = {
                title: form.title,
                summary: form.summary,
                bodyHtml: form.bodyHtml,
                coverUrl: form.coverUrl || null,
                fileUrl: form.fileUrl,
                mimeType: form.mimeType || null,
                audience: form.audience,
                isPublished: form.isPublished,
              };
              if (form.id) {
                await apiPatch(`/admin/learning-assets/${form.id}`, body);
                notify.success("Learning asset updated.");
              } else {
                await apiPost("/admin/learning-assets", body);
                notify.success("Learning asset created.");
              }
              setForm(emptyForm);
              await assets.refetch();
            } finally {
              setLoading(false);
            }
          }}
        >
          <h3 className="font-semibold">{form.id ? "Edit asset" : "Create asset"}</h3>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Summary"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
          >
            {audienceOptions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <div className="space-y-2">
            <p className="text-xs font-semibold">Cover</p>
            {form.coverUrl ? (
              <img src={form.coverUrl} alt="" className="h-28 w-full rounded-md object-cover" />
            ) : null}
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const up = await apiUpload(file, "ndpo/learning");
                  setForm((f) => ({ ...f, coverUrl: up.url }));
                  notify.success("Cover uploaded.");
                } catch (err) {
                  notify.error(err instanceof Error ? err.message : "Upload failed.");
                }
              }}
            />
            <Button type="button" size="sm" variant="outline" onClick={() => coverRef.current?.click()}>
              Upload cover
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold">Learning file</p>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="File URL"
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
              required
            />
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*,video/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const up = await apiUpload(file, "ndpo/learning");
                  setForm((f) => ({ ...f, fileUrl: up.url, mimeType: up.mime || file.type }));
                  notify.success("File uploaded.");
                } catch (err) {
                  notify.error(err instanceof Error ? err.message : "Upload failed.");
                }
              }}
            />
            <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              Upload file
            </Button>
          </div>
          <textarea
            className="min-h-28 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Body (HTML or notes)"
            value={form.bodyHtml}
            onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Published
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={loading}>
              {form.id ? "Update" : "Create"}
            </Button>
            {form.id ? (
              <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
                Clear
              </Button>
            ) : null}
          </div>
        </form>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Assets</h3>
          {assets.isFetching && !assets.data ? <Skeleton className="mt-3 h-24" /> : null}
          <ul className="mt-3 space-y-3 text-sm">
            {(assets.data ?? []).map((a) => (
              <li key={a.id} className="border-t border-border pt-3">
                <button
                  type="button"
                  className="text-left font-medium text-[color:var(--brand-green)]"
                  onClick={() =>
                    setForm({
                      id: a.id,
                      title: a.title,
                      summary: a.summary ?? "",
                      bodyHtml: a.bodyHtml ?? "",
                      coverUrl: a.coverUrl ?? "",
                      fileUrl: a.fileUrl,
                      mimeType: a.mimeType ?? "",
                      audience: a.audience,
                      isPublished: a.isPublished,
                    })
                  }
                >
                  {a.title}
                </button>
                <p className="text-xs text-muted-foreground">
                  {a.audience} · {a.isPublished ? "Published" : "Draft"}
                </p>
              </li>
            ))}
            {(assets.data ?? []).length === 0 && (
              <p className="text-muted-foreground">No learning assets yet.</p>
            )}
          </ul>
        </div>
      </div>

      {form.id ? <AssignmentPanel assetId={form.id} /> : null}
    </div>
  );
}

type Assignment = {
  id: string;
  title: string;
  instructions: string;
  dueOn?: string | null;
  isPublished: boolean;
  submissions: {
    id: string;
    notes: string;
    status: string;
    adminNote?: string | null;
    createdAt: string;
    user: { firstName: string; lastName: string; email: string };
  }[];
};

function AssignmentPanel({ assetId }: { assetId: string }) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [loading, setLoading] = useState(false);
  const q = useQuery({
    queryKey: ["admin-learning-assignments", assetId],
    queryFn: () => apiGet<Assignment[]>(`/admin/learning-assets/${assetId}/assignments`),
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-semibold">Assignments for this asset</h3>
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await apiPost(`/admin/learning-assets/${assetId}/assignments`, {
              title,
              instructions,
              ...(dueOn ? { dueOn: new Date(dueOn).toISOString() } : {}),
            });
            notify.success("Assignment published.");
            setTitle("");
            setInstructions("");
            setDueOn("");
            await q.refetch();
          } finally {
            setLoading(false);
          }
        }}
      >
        <input
          className="rounded-md border px-3 py-2 text-sm"
          required
          placeholder="Assignment title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
        <input
          type="date"
          className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
          value={dueOn}
          onChange={(e) => setDueOn(e.target.value)}
        />
        <Button type="submit" loading={loading} className="sm:col-span-2 w-fit">
          Add assignment
        </Button>
      </form>
      {(q.data ?? []).map((a) => (
        <div key={a.id} className="border-t border-border pt-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.instructions}</p>
              {a.dueOn ? (
                <p className="text-xs text-muted-foreground">Due {new Date(a.dueOn).toLocaleDateString("en-NG")}</p>
              ) : null}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                void apiPatch(`/admin/learning-assignments/${a.id}`, { isPublished: !a.isPublished }).then(() => {
                  notify.success(a.isPublished ? "Assignment unpublished." : "Assignment published.");
                  void q.refetch();
                })
              }
            >
              {a.isPublished ? "Unpublish" : "Publish"}
            </Button>
          </div>
          <ul className="mt-2 space-y-2">
            {a.submissions.map((s) => (
              <li key={s.id} className="rounded-md bg-muted/40 p-3">
                <p className="font-medium">
                  {s.user.firstName} {s.user.lastName} · {s.status}
                </p>
                <p className="text-xs text-muted-foreground">{s.notes}</p>
                {s.status !== "REVIEWED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      void apiPatch(`/admin/learning-submissions/${s.id}`, { status: "REVIEWED" }).then(() => {
                        notify.success("Marked reviewed.");
                        void q.refetch();
                      })
                    }
                  >
                    Mark reviewed
                  </Button>
                ) : null}
              </li>
            ))}
            {a.submissions.length === 0 && <p className="text-xs text-muted-foreground">No submissions yet.</p>}
          </ul>
        </div>
      ))}
    </div>
  );
}
