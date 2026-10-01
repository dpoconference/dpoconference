import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IdCard } from "lucide-react";
import { apiBlob, apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MembershipDigitalCard } from "@/components/app/MembershipDigitalCard";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatusChip } from "@/components/app/StatusChip";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/portal/card")({
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my-membership"],
    queryFn: () =>
      apiGet<{
        membershipNumber: string;
        status: string;
        membershipYear: number;
        expiresOn: string;
        organisationName?: string | null;
        category: { name: string };
        user?: { firstName: string; lastName: string; avatarUrl?: string | null };
        cards: { qrDataUrl?: string; imageUrl?: string; issuedOn: string }[];
      } | null>("/membership/me"),
  });

  if (q.isPending) return <PageSkeleton />;
  if (!q.data) {
    return (
      <div className="space-y-6">
        <PageHeader icon={IdCard} title="Digital card" subtitle="Your card is issued after membership approval." />
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">No digital card yet. Your card is issued after approval.</p>
        </div>
      </div>
    );
  }

  const card = q.data.cards?.[0];
  const membershipNumber = q.data.membershipNumber;
  const photo = card?.imageUrl || q.data.user?.avatarUrl || user?.avatarUrl;
  const firstName = q.data.user?.firstName || user?.firstName || "";
  const lastName = q.data.user?.lastName || user?.lastName || "";

  return (
    <div className="space-y-8">
      <PageHeader
        icon={IdCard}
        title="Digital card"
        subtitle="Present this card for verification. The QR opens the public member check — it is not a conference door ticket."
        actions={<StatusChip tone="success">{q.data.status}</StatusChip>}
      />

      <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-start">
        <MembershipDigitalCard
          firstName={firstName}
          lastName={lastName}
          categoryName={q.data.category.name}
          membershipNumber={membershipNumber}
          membershipYear={q.data.membershipYear}
          status={q.data.status}
          expiresOn={q.data.expiresOn}
          organisationName={q.data.organisationName}
          photoUrl={photo}
          qrDataUrl={card?.qrDataUrl}
        />

        <div className="flex w-full max-w-sm flex-col gap-3 print:hidden">
          <p className="text-sm text-muted-foreground">
            Download a text PDF for your records, or print this card. Conference door staff use the e-invite QR, not this
            membership card.
          </p>
          <Button
            type="button"
            className="w-full rounded-full"
            onClick={() =>
              void apiBlob("/membership/me/card.pdf", `dpo-card-${membershipNumber}.pdf`).then(() =>
                notify.success("Card PDF downloaded."),
              )
            }
          >
            Download PDF
          </Button>
          <Button type="button" variant="outline" className="w-full rounded-full" onClick={() => window.print()}>
            Print card
          </Button>
        </div>
      </div>
    </div>
  );
}
