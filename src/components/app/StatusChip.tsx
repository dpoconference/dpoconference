import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  success: "bg-[color:var(--success)]/10 text-[color:var(--success)]",
  warning: "bg-[color:var(--warning)]/15 text-foreground",
  danger: "bg-destructive/10 text-destructive",
  sky: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
};

export function StatusChip({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
