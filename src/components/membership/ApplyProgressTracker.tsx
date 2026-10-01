import type { LucideIcon } from "lucide-react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrackerStep = {
  id: number;
  title: string;
  detail: string;
  icon: LucideIcon;
};

export function ApplyProgressTracker({
  steps,
  current,
  onStepClick,
}: {
  steps: TrackerStep[];
  current: number;
  onStepClick?: (step: number) => void;
}) {
  return (
    <nav aria-label="Application progress" className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <ol className="space-y-0">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = s.id < current;
          const active = s.id === current;
          const clickable = Boolean(onStepClick) && (done || active);
          return (
            <li key={s.id} className="relative flex gap-3 sm:gap-4">
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[15px] top-9 h-[calc(100%-12px)] w-0.5 sm:left-[19px]",
                    done ? "bg-[color:var(--brand-emerald)]" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(s.id)}
                className={cn(
                  "relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 sm:h-10 sm:w-10",
                  done && "border-[color:var(--brand-emerald)] bg-[color:var(--brand-emerald)] text-white",
                  active && "border-[color:var(--brand-emerald)] bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]",
                  !done && !active && "border-border bg-background text-muted-foreground",
                  clickable && "cursor-pointer hover:opacity-90",
                  !clickable && "cursor-default",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-4 w-4" /> : active ? <Icon className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </button>
              <div className={cn("min-w-0 flex-1 pb-5 sm:pb-6", i === steps.length - 1 && "pb-0")}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.title}
                  </p>
                  {active && (
                    <span className="rounded-full bg-[color:var(--brand-tint)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--brand-deep)]">
                      Current
                    </span>
                  )}
                  {done && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--brand-emerald)]">
                      Completed
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{s.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
