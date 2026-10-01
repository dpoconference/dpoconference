import { DEMO_LOGINS, type DemoLogin } from "@/lib/demo-logins";

export function DemoLogins({
  onPick,
  suite = "all",
}: {
  onPick: (account: DemoLogin) => void;
  suite?: "admin" | "portal" | "all";
}) {
  const list = suite === "all" ? DEMO_LOGINS : DEMO_LOGINS.filter((a) => a.suite === suite);

  return (
    <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Quick demo access</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Seeded workspaces for testing each dashboard. For local evaluation only.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {list.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => onPick(account)}
            className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground hover:border-primary/40"
          >
            {account.label}
          </button>
        ))}
      </div>
    </div>
  );
}
