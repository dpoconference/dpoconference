import { sanitizeHtml } from "@/lib/sanitizeHtml";

export function SafeHtml({ html, className }: { html?: string | null; className?: string }) {
  if (!html?.trim()) return null;
  return (
    <div
      className={className ?? "prose prose-sm max-w-none leading-relaxed [&_a]:text-[color:var(--brand-green)] [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg"}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
