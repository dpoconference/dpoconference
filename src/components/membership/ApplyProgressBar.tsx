import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BarStep = { id: number; title: string; icon: LucideIcon };

export function ApplyProgressBar({ steps, current }: { steps: BarStep[]; current: number }) {
  const pct = ((current - 1) / Math.max(1, steps.length - 1)) * 100;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Progress · Step {current} of {steps.length}
        </p>
        <p className="text-xs font-medium text-[color:var(--brand-deep)]">{Math.round((current / steps.length) * 100)}%</p>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[color:var(--brand-emerald)] transition-all"
          style={{ width: `${Math.max(8, pct)}%` }}
        />
      </div>
      <ol className="mt-4 grid grid-cols-5 gap-1 sm:gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const done = s.id < current;
          const active = s.id === current;
          return (
            <li key={s.id} className="min-w-0 text-center">
              <span
                className={cn(
                  "mx-auto flex h-8 w-8 items-center justify-center rounded-full border sm:h-9 sm:w-9",
                  done && "border-[color:var(--brand-emerald)] bg-[color:var(--brand-emerald)] text-white",
                  active && "border-[color:var(--brand-emerald)] bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]",
                  !done && !active && "border-border bg-background text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <p
                className={cn(
                  "mt-1.5 truncate text-[10px] font-medium sm:text-xs",
                  active || done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.title}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
