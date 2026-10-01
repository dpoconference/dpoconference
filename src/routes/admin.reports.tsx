import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { apiBlob, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/reports")({
  component: Page,
});

function Page() {
  const { hasPermission } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const canJobs = hasPermission("fees.manage");

  return (
    <div className="space-y-6 max-w-lg">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">CSV exports</h2>
        <Button variant="outline" onClick={() => void apiBlob("/admin/reports/members.csv", "members.csv")}>
          Members
        </Button>
        <Button variant="outline" onClick={() => void apiBlob("/admin/reports/payments.csv", "payments.csv")}>
          Payments
        </Button>
        <Button variant="outline" onClick={() => void apiBlob("/admin/reports/conference.csv", "conference.csv")}>
          Conference registrations
        </Button>
        <Button variant="outline" onClick={() => void apiBlob("/admin/reports/seminars.csv", "seminars.csv")}>
          Seminar registrations
        </Button>
      </div>
      {canJobs && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Maintenance jobs</h2>
          <p className="text-sm text-muted-foreground">Daily cron also runs these 15 seconds after API start.</p>
          <Button
            variant="outline"
            loading={busy === "expire"}
            onClick={async () => {
              setBusy("expire");
              try {
                const data = await apiPost<{ expired: number }>("/admin/jobs/expire-memberships", {});
                notify.success(`Expiry job finished. ${data.expired ?? 0} memberships expired.`);
              } finally {
                setBusy(null);
              }
            }}
          >
            Run expiry job
          </Button>
          <Button
            variant="outline"
            loading={busy === "remind"}
            onClick={async () => {
              setBusy("remind");
              try {
                const data = await apiPost<{ sent: number }>("/admin/jobs/renewal-reminders", {});
                notify.success(`Renewal reminders sent: ${data.sent ?? 0}.`);
              } finally {
                setBusy(null);
              }
            }}
          >
            Send renewal reminders
          </Button>
        </div>
      )}
    </div>
  );
}
