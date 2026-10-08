import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  organisation?: string | null;
  jobTitle?: string | null;
  status: string;
  lastError?: string | null;
  registration?: { registrationNumber: string; loginReleaseStatus: string } | null;
};

type GroupRegistration = {
  id: string;
  registrationReference: string;
  organisationName: string;
  contactName: string;
  contactEmail: string;
  quantity: number;
  unitPriceNgn: number;
  totalNgn: number;
  status: string;
  onboardingStatus: string;
  conference: { title: string; slug: string };
  packageName: string;
  payment: { status: string; paystackReference: string; paidAt: string | null } | null;
  participants: Participant[];
};

type ParticipantInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organisation: string;
  jobTitle: string;
};

type Preview = {
  expectedQuantity: number;
  receivedQuantity: number;
  valid: boolean;
  errors: { row: number; message: string }[];
};

const blankParticipant = (): ParticipantInput => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organisation: "",
  jobTitle: "",
});

export function GroupParticipantOnboarding() {
  const groups = useQuery({
    queryKey: ["admin-group-registrations"],
    queryFn: () => apiGet<GroupRegistration[]>("/admin/events/conferences/group-registrations"),
  });
  const [selectedId, setSelectedId] = useState("");
  const [participants, setParticipants] = useState<ParticipantInput[]>([blankParticipant()]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const selected = (groups.data ?? []).find((group) => group.id === selectedId);

  const selectedOption = useMemo(
    () =>
      (groups.data ?? []).map((group) => ({
        ...group,
        label: `${group.organisationName} · ${group.registrationReference} · ${group.payment?.status ?? group.status}`,
      })),
    [groups.data],
  );

  async function previewList() {
    if (!selected) return;
    setLoading(true);
    try {
      const result = await apiPost<Preview>(
        `/admin/events/conferences/group-registrations/${selected.id}/participants/preview`,
        { participants },
      );
      setPreview(result);
      if (result.valid) notify.success("Participant list is valid. Review it, then commit.");
    } catch (error) {
      setPreview(null);
      notify.error(error instanceof Error ? error.message : "Participant list could not be validated.");
    } finally {
      setLoading(false);
    }
  }

  async function commitList() {
    if (!selected || !preview?.valid) return;
    setLoading(true);
    try {
      await apiPost(
        `/admin/events/conferences/group-registrations/${selected.id}/participants/commit`,
        { participants },
      );
      notify.success("Participants were added. Invite delivery status is shown below.");
      setPreview(null);
      await groups.refetch();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Participants could not be onboarded.");
    } finally {
      setLoading(false);
    }
  }

  async function retry(groupId: string) {
    setLoading(true);
    try {
      await apiPost(`/admin/events/conferences/group-registrations/${groupId}/participants/retry`, {});
      notify.success("Onboarding retry completed. Check participant statuses below.");
      await groups.refetch();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Onboarding retry failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
      <div>
        <h3 className="font-bold">Organisation / group registrations</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Review payment, validate the paid participant count and emails, then commit. Existing users are
          linked by email; learner setup messages remain held until an administrator explicitly releases them.
        </p>
      </div>
      {groups.isPending ? <p className="text-sm text-muted-foreground">Loading group registrations…</p> : null}
      {groups.isError ? (
        <p className="text-sm text-destructive">Could not load group registrations.</p>
      ) : null}
      {selectedOption.length ? (
        <div className="grid gap-5">
          {selectedOption.map((group) => (
            <article key={group.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">{group.organisationName}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {group.conference.title} · {group.packageName} · {group.contactName} · {group.contactEmail}
                  </p>
                  <p className="mt-1 font-mono text-xs">{group.registrationReference}</p>
                  <p className="mt-2 text-sm">
                    Payment: <strong>{group.payment?.status ?? group.status}</strong> · {group.quantity} places ·{" "}
                    {formatNaira(group.totalNgn)}
                  </p>
                </div>
                {group.participants.some((participant) => participant.status !== "INVITE_SENT") ? (
                  <Button size="sm" variant="outline" loading={loading} onClick={() => void retry(group.id)}>
                    Retry invite delivery
                  </Button>
                ) : null}
              </div>
              {group.participants.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase text-muted-foreground">
                        <th className="p-2">Participant</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Registration</th>
                        <th className="p-2">Onboarding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.participants.map((participant) => (
                        <tr key={participant.id} className="border-t">
                          <td className="p-2">{participant.firstName} {participant.lastName}</td>
                          <td className="p-2">{participant.email}</td>
                          <td className="p-2 font-mono text-xs">{participant.registration?.registrationNumber ?? participant.status}</td>
                          <td className="p-2">
                            {participant.status === "INVITE_SENT"
                              ? `Event invite sent; learner access ${participant.registration?.loginReleaseStatus?.replaceAll("_", " ").toLowerCase() ?? "pending admin release"}`
                              : "Retry required"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : group.status === "PAID" || group.status === "CONFIRMED" ? (
                <div className="mt-4 space-y-3 rounded-lg bg-muted/40 p-4">
                  <p className="text-sm">Enter exactly {group.quantity} participants for this paid registration.</p>
                  {group.id === selectedId ? (
                    <>
                      <div className="space-y-3">
                        {participants.map((participant, index) => (
                          <div key={index} className="grid gap-2 rounded-lg border bg-background p-3 md:grid-cols-3">
                            {(
                              [
                                ["firstName", "First name"],
                                ["lastName", "Last name"],
                                ["email", "Email"],
                                ["phone", "Telephone (optional)"],
                                ["organisation", "Organisation (optional)"],
                                ["jobTitle", "Job title (optional)"],
                              ] as const
                            ).map(([key, label]) => (
                              <input
                                key={key}
                                type={key === "email" ? "email" : "text"}
                                placeholder={label}
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                value={participant[key]}
                                onChange={(event) => {
                                  const next = participants.map((row, rowIndex) =>
                                    rowIndex === index ? { ...row, [key]: event.target.value } : row,
                                  );
                                  setParticipants(next);
                                  setPreview(null);
                                }}
                              />
                            ))}
                            {participants.length > 1 ? (
                              <button
                                type="button"
                                className="text-left text-xs text-destructive"
                                onClick={() => {
                                  setParticipants((current) => current.filter((_, rowIndex) => rowIndex !== index));
                                  setPreview(null);
                                }}
                              >
                                Remove participant
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={participants.length >= group.quantity || loading}
                          onClick={() => {
                            setParticipants((current) => [...current, blankParticipant()]);
                            setPreview(null);
                          }}
                        >
                          Add participant
                        </Button>
                        <Button size="sm" variant="outline" loading={loading} onClick={() => void previewList()}>
                          Validate and preview
                        </Button>
                        <Button size="sm" loading={loading} disabled={!preview?.valid} onClick={() => void commitList()}>
                          Commit participants
                        </Button>
                      </div>
                      {preview ? (
                        <div className="rounded-lg border p-3 text-sm">
                          <p>{preview.receivedQuantity} rows · {preview.expectedQuantity} paid places · {preview.valid ? "Ready to commit" : "Needs correction"}</p>
                          {preview.errors.map((error, index) => (
                            <p key={index} className="mt-1 text-destructive">
                              {error.row ? `Row ${error.row}: ` : ""}{error.message}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedId(group.id);
                        setParticipants(Array.from({ length: Math.min(group.quantity, 10) }, blankParticipant));
                        setPreview(null);
                      }}
                    >
                      Enter participant list
                    </Button>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Participant onboarding is available after payment is confirmed.</p>
              )}
            </article>
          ))}
        </div>
      ) : !groups.isPending ? (
        <p className="text-sm text-muted-foreground">No organisation / group registrations yet.</p>
      ) : null}
    </section>
  );
}
