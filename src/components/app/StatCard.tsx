import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  well = "primary",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  well?: "primary" | "gold" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const wells = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-gold/20 text-gold-foreground",
    success: "bg-[color:var(--success)]/10 text-[color:var(--success)]",
    warning: "bg-[color:var(--warning)]/15 text-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 transition", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", wells[well])}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 ", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
