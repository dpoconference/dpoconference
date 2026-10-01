import { FileText, ExternalLink } from "lucide-react";

function isImageUrl(url: string, mime?: string) {
  if (mime?.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(url);
}

function isPdfUrl(url: string, mime?: string) {
  if (mime === "application/pdf") return true;
  return /\.pdf(\?|$)/i.test(url);
}

export function AssetPreview({
  url,
  label,
  mime,
}: {
  url: string;
  label: string;
  mime?: string;
}) {
  const image = isImageUrl(url, mime);
  const pdf = isPdfUrl(url, mime);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="truncate text-sm font-medium">{label}</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[color:var(--brand-green)] hover:underline"
        >
          Open <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      {image ? (
        <a href={url} target="_blank" rel="noreferrer" className="block bg-background p-2">
          <img src={url} alt={label} className="mx-auto max-h-64 w-full object-contain" />
        </a>
      ) : pdf ? (
        <iframe title={label} src={url} className="h-72 w-full bg-background" />
      ) : (
        <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <FileText className="h-8 w-8 shrink-0" />
          <span>Preview not available for this file type. Use Open to view.</span>
        </div>
      )}
    </div>
  );
}
