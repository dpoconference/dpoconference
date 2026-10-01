import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type NeedActionItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  urgency: "high" | "medium" | "low";
};

export function NeedActionPanel({ items }: { items: NeedActionItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Needs attention</h2>
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nothing requires action right now.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href as never}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3.5 transition hover:border-primary/40",
                  item.urgency === "high" && "border-destructive/35 bg-destructive/5",
                  item.urgency === "medium" && "border-amber-500/30 bg-amber-500/5",
                  item.urgency === "low" && "border-border bg-background",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    item.urgency === "high" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                  )}
                >
                  <AlertCircle className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.body}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  {item.cta}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
