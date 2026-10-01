import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Maximize2 } from "lucide-react";
import { apiGet, apiObjectUrl, apiPost } from "@/lib/api";
import { apiPortalUpload } from "@/lib/upload";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/portal/library/$id")({
  component: Page,
});

type Assignment = {
  id: string;
  title: string;
  instructions: string;
  dueOn?: string | null;
  submission: { id: string; notes: string; status: string; adminNote?: string | null } | null;
};

type AssetMeta = {
  id: string;
  title: string;
  summary?: string | null;
  bodyHtml?: string | null;
  mimeType?: string | null;
  audience?: string;
  percent?: number;
  completedAt?: string | null;
  assignments?: Assignment[];
};

function Page() {
  const { id } = Route.useParams();
  const stageRef = useRef<HTMLDivElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState("application/pdf");
  const [fileError, setFileError] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [presenting, setPresenting] = useState(false);

  const meta = useQuery({
    queryKey: ["portal-library-asset", id],
    queryFn: () => apiGet<AssetMeta>(`/portal/library/${id}`),
  });

  useEffect(() => {
    if (typeof meta.data?.percent === "number") setPercent(meta.data.percent);
  }, [meta.data?.percent]);

  useEffect(() => {
    function onFs() {
      setPresenting(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    setFileError(null);
    setObjectUrl(null);
    void apiObjectUrl(`/portal/library/${id}/file`)
      .then(({ url, contentType: ct }) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        revoked = url;
        setObjectUrl(url);
        setContentType(ct);
      })
      .catch((err) => {
        if (!cancelled) setFileError(err instanceof Error ? err.message : "Could not open file.");
      });
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [id]);

  async function saveProgress(next: number, completed?: boolean) {
    setSaving(true);
    try {
      const row = await apiPost<{ percent: number }>(`/portal/library/${id}/progress`, {
        percent: next,
        completed,
      });
      setPercent(row.percent);
      notify.success(completed || row.percent >= 100 ? "Marked complete." : "Progress saved.");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not save progress.");
    } finally {
      setSaving(false);
    }
  }

  async function present() {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (el.requestFullscreen) await el.requestFullscreen();
      else notify.info("Fullscreen is not available in this browser.");
    } catch {
      notify.error("Could not enter presentation mode.");
    }
  }

  if (meta.isPending) return <PageSkeleton />;

  if (meta.isError || !meta.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/portal/library">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">This learning asset is not available.</p>
      </div>
    );
  }

  const isPdf = contentType.includes("pdf");
  const isImage = contentType.startsWith("image/");

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title={meta.data.title}
        subtitle={meta.data.summary || "Viewing only — downloading is not enabled."}
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void present()}>
              <Maximize2 className="h-4 w-4" /> {presenting ? "Exit presentation" : "Presentation mode"}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/portal/library">
                <ArrowLeft className="h-4 w-4" /> Library
              </Link>
            </Button>
          </div>
        }
      />

      <p className="rounded-xl border border-border bg-[color:var(--brand-tint)]/40 px-4 py-3 text-xs text-muted-foreground">
        Viewing only — downloading is not enabled. Presentation mode opens the material fullscreen for teaching or review.
      </p>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
        <label className="flex flex-1 items-center gap-3">
          Progress
          <input
            type="range"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-10 text-right font-semibold">{percent}%</span>
        </label>
        <Button size="sm" variant="outline" loading={saving} onClick={() => void saveProgress(percent)}>
          Save progress
        </Button>
        <Button size="sm" loading={saving} onClick={() => void saveProgress(100, true)}>
          Mark complete
        </Button>
      </div>

      {meta.data.bodyHtml ? (
        <div
          className="prose prose-sm max-w-none rounded-2xl border border-border bg-card p-5"
          dangerouslySetInnerHTML={{ __html: meta.data.bodyHtml }}
        />
      ) : null}

      <div ref={stageRef} className={`rounded-2xl bg-black p-1 ${presenting ? "flex h-screen flex-col" : ""}`}>
        {presenting ? (
          <p className="px-3 py-2 text-center text-xs text-white/80">
            Presentation mode · use the PDF page controls or arrow keys · Esc to exit
          </p>
        ) : null}
        {fileError ? (
          <p className="p-6 text-sm text-red-200">{fileError}</p>
        ) : !objectUrl ? (
          <PageSkeleton />
        ) : isImage ? (
          <img src={objectUrl} alt={meta.data.title} className="max-h-[80vh] w-full object-contain" />
        ) : (
          <iframe
            title={meta.data.title}
            src={
              isPdf
                ? `${objectUrl}#${presenting ? "toolbar=1&navpanes=0&view=FitH" : "toolbar=0&navpanes=0"}`
                : objectUrl
            }
            className={`w-full bg-white ${presenting ? "flex-1" : "h-[75vh]"}`}
          />
        )}
      </div>

      {(meta.data.assignments ?? []).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Assignments</h2>
          {meta.data.assignments!.map((a) => (
            <form
              key={a.id}
              className="space-y-3 rounded-2xl border border-border bg-card p-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const fileInput = (e.currentTarget.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
                setSaving(true);
                try {
                  let fileUrl: string | undefined;
                  if (fileInput) {
                    const up = await apiPortalUpload(fileInput, "ndpo/portal");
                    fileUrl = up.url;
                  }
                  await apiPost(`/portal/library/assignments/${a.id}/submit`, {
                    notes: (notes[a.id] || a.submission?.notes || "").trim(),
                    fileUrl,
                  });
                  notify.success("Assignment submitted.");
                  await meta.refetch();
                } catch (err) {
                  notify.error(err instanceof Error ? err.message : "Submit failed.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-muted-foreground">{a.instructions}</p>
              {a.submission ? (
                <p className="text-xs text-muted-foreground">
                  Last submission: {a.submission.status}
                  {a.submission.adminNote ? ` · ${a.submission.adminNote}` : ""}
                </p>
              ) : null}
              <textarea
                className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                required
                placeholder="Your notes / response"
                value={notes[a.id] ?? a.submission?.notes ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
              />
              <input name="file" type="file" className="text-sm" />
              <Button type="submit" loading={saving}>
                Submit assignment
              </Button>
            </form>
          ))}
        </section>
      )}
    </div>
  );
}
