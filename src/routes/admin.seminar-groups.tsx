import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";
import { formatNaira } from "@/lib/format";

type SeminarGroup = {
  id: string;
  registrationReference: string;
  organisationName: string;
  seminar: { title: string; startsOn: string };
  quantity: number;
  participantType: string;
  totalNgn: number;
  onboardedCount: number;
  remainingCount: number;
};

export const Route = createFileRoute("/admin/seminar-groups")({
  component: SeminarGroupOnboardingPage,
});

function SeminarGroupOnboardingPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [rosters, setRosters] = useState<Record<string, string>>({});
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null);
  const groups = useQuery({
    queryKey: ["admin-paid-seminar-groups"],
    queryFn: () => apiGet<SeminarGroup[]>("/admin/events/seminar-groups"),
    enabled: hasPermission("events.manage"),
  });

  if (!hasPermission("events.manage")) {
    return (
      <p className="text-sm text-muted-foreground">
        You need event-management permission to onboard seminar groups.
      </p>
    );
  }

  async function onboard(group: SeminarGroup) {
    const rows = (rosters[group.id] ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(",").map((value) => value.trim()));
    if (
      rows.length === 0 ||
      rows.length > group.remainingCount ||
      rows.some(
        (row) => row.length < 3 || row.length > 4 || row.slice(0, 3).some((value) => !value),
      )
    ) {
      notify.error(
        `Enter up to ${group.remainingCount} participants as First name,Last name,email[,phone].`,
      );
      return;
    }
    setBusyGroupId(group.id);
    try {
      const result = await apiPost<{ onboardedCount: number; remainingCount: number }>(
        `/admin/events/seminar-groups/${group.id}/participants`,
        {
          participants: rows.map(([firstName, lastName, email, phone]) => ({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone: phone || undefined,
          })),
        },
      );
      setRosters((current) => ({ ...current, [group.id]: "" }));
      notify.success(
        `${rows.length} participants linked to the seminar. ${result.remainingCount} paid place(s) remain.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-paid-seminar-groups"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-learners"] });
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Could not onboard seminar participants.",
      );
    } finally {
      setBusyGroupId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Seminar group onboarding"
        subtitle="Paid group places are reserved until participant details arrive. Onboarding creates seminar registrations and pending learner accounts; send setup links separately."
      />
      {groups.isPending ? (
        <p className="text-sm text-muted-foreground">Loading paid seminar groups…</p>
      ) : groups.isError ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-destructive">Paid seminar groups could not be loaded.</p>
          <Button className="mt-3" variant="outline" onClick={() => void groups.refetch()}>
            Retry
          </Button>
        </div>
      ) : groups.data.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          No paid seminar group registrations are awaiting participant details.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.data.map((group) => (
            <section
              key={group.id}
              className="space-y-3 rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{group.seminar.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {group.organisationName} · {group.registrationReference}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>
                    {group.onboardedCount} / {group.quantity} participants
                  </p>
                  <p className="text-muted-foreground">{formatNaira(group.totalNgn)} paid</p>
                </div>
              </div>
              {group.remainingCount ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Paste participant rows as First name,Last name,email[,phone]. Up to{" "}
                    {group.remainingCount} remaining.
                  </p>
                  <textarea
                    className="min-h-28 w-full rounded-md border px-3 py-2 font-mono text-sm"
                    value={rosters[group.id] ?? ""}
                    onChange={(event) =>
                      setRosters((current) => ({ ...current, [group.id]: event.target.value }))
                    }
                    placeholder={"Amina,Okoro,amina@example.com,08000000000"}
                  />
                  <Button
                    type="button"
                    loading={busyGroupId === group.id}
                    disabled={busyGroupId !== null}
                    onClick={() => void onboard(group)}
                  >
                    Create seminar participants
                  </Button>
                </>
              ) : (
                <p className="text-sm font-medium text-[color:var(--brand-green)]">
                  All paid places have participants.
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
