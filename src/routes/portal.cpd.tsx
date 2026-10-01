import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiBlob, apiGet, apiPost } from "@/lib/api";
import { apiPortalUpload } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/portal/cpd")({
  component: Page,
});

function Page() {
  const evidenceRef = useRef<HTMLInputElement>(null);
  const q = useQuery({
    queryKey: ["cpd"],
    queryFn: () =>
      apiGet<{
        year: number;
        required: number;
        points: number;
        outstanding: number;
        compliant: boolean;
        items: { id: string; title: string; status: string; points: string; source: string }[];
      }>("/portal/cpd"),
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    provider: "",
    activityOn: new Date().toISOString().slice(0, 10),
    activityType: "",
    durationHours: "",
    requestedPoints: 2,
    description: "External CPD activity",
    evidenceUrl: "",
  });
  if (q.isPending) return <Skeleton className="h-40" />;
  const d = q.data!;
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold tracking-tight">CPD {d.year}</h2>
        <p className="mt-2 text-sm">
          {d.points} / {d.required} points · {d.compliant ? "Compliant" : `${d.outstanding} outstanding`}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => void apiBlob("/portal/cpd/statement.pdf", "ndpo-cpd-statement.pdf")}>
          Download statement
        </Button>
      </div>
      <form
        className="rounded-2xl border border-border bg-card p-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await apiPost("/portal/cpd/external", {
              title: form.title,
              provider: form.provider,
              activityOn: new Date(form.activityOn).toISOString(),
              activityType: form.activityType || undefined,
              durationHours: form.durationHours ? Number(form.durationHours) : undefined,
              requestedPoints: form.requestedPoints,
              description: form.description,
              evidenceUrl: form.evidenceUrl || undefined,
            });
            notify.success("External CPD submitted for review.");
            setForm({
              title: "",
              provider: "",
              activityOn: new Date().toISOString().slice(0, 10),
              activityType: "",
              durationHours: "",
              requestedPoints: 2,
              description: "External CPD activity",
              evidenceUrl: "",
            });
            await q.refetch();
          } catch (err) {
            notify.error(err instanceof Error ? err.message : "Could not submit CPD.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <h3 className="font-bold">Submit external CPD</h3>
        <input
          className="w-full rounded-md border px-3 py-2"
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="w-full rounded-md border px-3 py-2"
          required
          placeholder="Provider"
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
        />
        <input
          className="w-full rounded-md border px-3 py-2"
          type="date"
          required
          value={form.activityOn}
          onChange={(e) => setForm({ ...form, activityOn: e.target.value })}
        />
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Activity type (e.g. workshop, webinar)"
          value={form.activityType}
          onChange={(e) => setForm({ ...form, activityType: e.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="w-full rounded-md border px-3 py-2"
            type="number"
            min="0.5"
            step="0.5"
            placeholder="Duration (hours)"
            value={form.durationHours}
            onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
          />
          <input
            className="w-full rounded-md border px-3 py-2"
            type="number"
            min="0.5"
            step="0.5"
            required
            placeholder="Requested points"
            value={form.requestedPoints}
            onChange={(e) => setForm({ ...form, requestedPoints: Number(e.target.value) })}
          />
        </div>
        <textarea
          className="min-h-20 w-full rounded-md border px-3 py-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="space-y-2">
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Evidence URL"
            value={form.evidenceUrl}
            onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })}
          />
          <input
            ref={evidenceRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const up = await apiPortalUpload(file, "ndpo/cpd");
                setForm((f) => ({ ...f, evidenceUrl: up.url }));
                notify.success("Evidence uploaded.");
              } catch (err) {
                notify.error(err instanceof Error ? err.message : "Upload failed.");
              } finally {
                setUploading(false);
              }
            }}
          />
          <Button type="button" size="sm" variant="outline" loading={uploading} onClick={() => evidenceRef.current?.click()}>
            Upload evidence
          </Button>
        </div>
        <Button type="submit" loading={loading} className="gradient-brand text-white">
          Submit
        </Button>
      </form>
      <ul className="rounded-2xl border border-border bg-card p-6 space-y-2 text-sm">
        {d.items.map((i) => (
          <li key={i.id}>
            {i.title} · {i.source} · {i.status} · {i.points}
          </li>
        ))}
      </ul>
    </div>
  );
}
