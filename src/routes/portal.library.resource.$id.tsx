import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen } from "lucide-react";
import { apiGet, apiObjectUrl } from "@/lib/api";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal/library/resource/$id")({
  component: Page,
});

type LibraryResource = {
  id: string;
  title: string;
  summary?: string | null;
  bodyHtml?: string | null;
  accessLevel?: string;
};

function Page() {
  const { id } = Route.useParams();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState("application/pdf");
  const [fileError, setFileError] = useState<string | null>(null);

  const meta = useQuery({
    queryKey: ["portal-library"],
    queryFn: () =>
      apiGet<{ assets: unknown[]; resources: LibraryResource[] }>("/portal/library"),
  });

  const resource = (meta.data?.resources ?? []).find((r) => r.id === id) ?? null;

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    setFileError(null);
    setObjectUrl(null);
    void apiObjectUrl(`/portal/resources/${id}/file`)
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

  if (meta.isPending) return <PageSkeleton />;

  if (meta.isError || !resource) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/portal/library">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">This resource is not available for your membership.</p>
      </div>
    );
  }

  const isPdf = contentType.includes("pdf");
  const isImage = contentType.startsWith("image/");
  const title = resource.title;
  const hasBody = Boolean(resource.bodyHtml);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title={title}
        subtitle={resource.summary || "Viewing only — downloading is not enabled."}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/portal/library">
              <ArrowLeft className="h-4 w-4" /> Library
            </Link>
          </Button>
        }
      />

      <p className="rounded-xl border border-border bg-[color:var(--brand-tint)]/40 px-4 py-3 text-xs text-muted-foreground">
        Viewing only — downloading is not enabled.
      </p>

      {hasBody ? (
        <div
          className="prose prose-sm max-w-none rounded-2xl border border-border bg-card p-5"
          dangerouslySetInnerHTML={{ __html: resource.bodyHtml ?? "" }}
        />
      ) : null}

      {objectUrl && isImage ? (
        <img src={objectUrl} alt={title} className="max-h-[80vh] w-full rounded-2xl border border-border object-contain" />
      ) : objectUrl ? (
        <iframe
          title={title}
          src={objectUrl}
          className="h-[75vh] w-full rounded-2xl border border-border bg-card"
          {...(isPdf ? {} : {})}
        />
      ) : null}

      {!objectUrl && !fileError && !hasBody ? <PageSkeleton /> : null}
      {fileError && !objectUrl && !hasBody ? <p className="text-sm text-red-700">{fileError}</p> : null}
    </div>
  );
}
