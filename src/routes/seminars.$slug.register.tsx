import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import { loadPaymentsConfig, startCheckout } from "@/lib/checkout";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";
import {
  BankTransferCheckout,
  type BankTransferSession,
} from "@/components/payments/BankTransferCheckout";
import {
  PaymentMethodStep,
  resolveDefaultMethod,
  type PaymentMethodChoice,
} from "@/components/payments/PaymentMethodStep";

export const Route = createFileRoute("/seminars/$slug/register")({
  validateSearch: (search: Record<string, unknown>): { waitlistRegistrationNumber?: string } => ({
    waitlistRegistrationNumber:
      typeof search.waitlistRegistrationNumber === "string"
        ? search.waitlistRegistrationNumber
        : undefined,
  }),
  head: () => ({ meta: [{ title: "Seminar registration | Data Protection Officers Conference" }] }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { waitlistRegistrationNumber } = Route.useSearch();
  const isWaitlistInvitation = Boolean(waitlistRegistrationNumber);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["seminar", slug],
    queryFn: () =>
      apiGet<{
        title: string;
        soldOut: boolean;
        registrationOpen: boolean;
        registrationClosed: boolean;
        paymentRequired: boolean;
        nonMemberPrice: number;
        corporatePrice: number;
      }>(`/public/seminars/${slug}`),
    enabled: !user,
  });
  const payCfg = useQuery({ queryKey: ["payments-config"], queryFn: () => loadPaymentsConfig() });
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<PaymentMethodChoice>("PAYSTACK");
  const [bankSession, setBankSession] = useState<BankTransferSession | null>(null);
  const [registrationMode, setRegistrationMode] = useState<"individual" | "group">("individual");
  const [group, setGroup] = useState<{
    registrationReference: string;
    contactEmail: string;
  } | null>(null);
  const [groupStatus, setGroupStatus] = useState<{
    paid: boolean;
    paymentStatus: string;
    whatsappUrl: string | null;
    fallbackInstructions: string;
  } | null>(null);
  const [checkingGroup, setCheckingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({
    participantType: "GENERAL" as "GENERAL" | "CORPORATE",
    quantity: 2,
    organisationName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [details, setDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organisation: "",
    jobTitle: "",
  });

  useEffect(() => {
    if (payCfg.data) setMethod(resolveDefaultMethod(payCfg.data));
  }, [payCfg.data]);

  if (!authLoading && user) {
    return (
      <Navigate
        to="/portal/training/$slug"
        params={{ slug }}
        search={{ waitlistRegistrationNumber }}
      />
    );
  }

  async function submit() {
    setLoading(true);
    try {
      if (registrationMode === "group") {
        if (
          !groupForm.organisationName.trim() ||
          !groupForm.contactName.trim() ||
          !groupForm.contactEmail.trim() ||
          !groupForm.contactPhone.trim() ||
          groupForm.quantity < 2 ||
          groupForm.quantity > 500
        ) {
          notify.error(
            "Enter the organisation, coordinator details and a group size between 2 and 500.",
          );
          return;
        }
        const registration = await apiPost<{
          id: string;
          registrationReference: string;
          totalNgn: number;
          paymentRequired: boolean;
        }>(`/public/seminars/${slug}/groups`, {
          ...groupForm,
          contactEmail: groupForm.contactEmail.trim().toLowerCase(),
          quantity: Number(groupForm.quantity),
        });
        const access = {
          registrationReference: registration.registrationReference,
          contactEmail: groupForm.contactEmail.trim().toLowerCase(),
        };
        setGroup(access);
        if (registration.paymentRequired) {
          const pay = await startCheckout({
            purpose: "SEMINAR",
            linkedId: registration.id,
            email: access.contactEmail,
            method,
          });
          if (pay.mode === "bank") {
            setBankSession(pay.session);
            notify.success(
              "Group registration saved. Complete the bank transfer to confirm the places.",
            );
            return;
          }
          if (pay.cancelled) {
            notify.error("Payment was cancelled. Your group registration is not confirmed.");
            return;
          }
          if (!pay.verified) {
            notify.error(
              "Payment is not confirmed yet. Check its status using the registration reference.",
            );
            return;
          }
        }
        if (await checkGroupStatus(access)) {
          notify.success(
            `Group registration confirmed. Reference: ${registration.registrationReference}`,
          );
        }
        return;
      }

      const data = await apiPost<{
        id: string;
        registrationNumber: string;
        waitlist: boolean;
        paymentRequired: boolean;
        amountNgn: number;
      }>(`/public/seminars/${slug}/register`, {
        participantType: "GENERAL",
        waitlistRegistrationNumber,
        details,
      });
      if (data.waitlist) {
        notify.success(`Added to waitlist. ${data.registrationNumber}`);
        await navigate({ to: "/training" });
        return;
      }
      if (data.paymentRequired && data.amountNgn > 0) {
        const pay = await startCheckout({
          purpose: "SEMINAR",
          linkedId: data.id,
          email: details.email,
          method,
        });
        if (pay.mode === "bank") {
          setBankSession(pay.session);
          notify.success("Registration saved. Complete bank transfer below.");
          return;
        }
        if (pay.cancelled) {
          notify.error("Payment was cancelled.");
          return;
        }
        if (pay.verified) notify.success(`Registered. ${data.registrationNumber}`);
      } else {
        notify.success(`Registered. ${data.registrationNumber}`);
      }
      await navigate({ to: "/training" });
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not complete registration.");
    } finally {
      setLoading(false);
    }
  }

  async function checkGroupStatus(access = group): Promise<boolean> {
    if (!access) return false;
    setCheckingGroup(true);
    try {
      const status = await apiPost<{
        paid: boolean;
        paymentStatus: string;
        whatsappUrl: string | null;
        fallbackInstructions: string;
      }>("/public/seminar-group-registrations/status", access);
      setGroupStatus(status);
      if (!status.paid) notify.error("Payment is still pending verification.");
      return status.paid;
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Could not check group payment status.",
      );
      return false;
    } finally {
      setCheckingGroup(false);
    }
  }

  async function openGroupHandoff(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (!groupStatus?.whatsappUrl || !group) return;
    try {
      await apiPost("/public/seminar-group-registrations/whatsapp-handoff", group);
      window.open(groupStatus.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not open the WhatsApp handoff.");
    }
  }

  if (q.isPending || authLoading) {
    return (
      <SiteLayout>
        <PageHero title="Seminar registration" />
        <div className="mx-auto max-w-xl px-6 py-12">
          <Skeleton className="h-64" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero
        title={q.data?.title ?? "Seminar"}
        subtitle={
          q.data?.registrationClosed
            ? "Registration for this seminar has closed."
            : !isWaitlistInvitation && (q.data?.soldOut || !q.data?.registrationOpen)
              ? "Registration is not currently available. Join the waitlist to be notified."
              : "Register for this professional learning programme."
        }
      />
      <section className="mx-auto max-w-xl space-y-3 px-6 py-12">
        {bankSession ? (
          <BankTransferCheckout
            session={bankSession}
            onSubmitted={() => notify.success("Receipt submitted for verification.")}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              <button
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-semibold ${registrationMode === "individual" ? "bg-white shadow" : ""}`}
                onClick={() => setRegistrationMode("individual")}
              >
                Individual registration
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-semibold ${registrationMode === "group" ? "bg-white shadow" : ""}`}
                onClick={() => setRegistrationMode("group")}
              >
                Bulk registration
              </button>
            </div>
            {registrationMode === "individual" ? (
              <>
                <p className="text-sm">Fee {formatNaira(Number(q.data?.nonMemberPrice ?? 0))}</p>
                {["firstName", "lastName", "email", "phone", "organisation"].map((k) => (
                  <input
                    key={k}
                    className="w-full rounded-md border px-3 py-3"
                    placeholder={k}
                    value={(details as Record<string, string>)[k]}
                    onChange={(e) => setDetails({ ...details, [k]: e.target.value })}
                  />
                ))}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  The total is calculated from the seminar group rate and confirmed by the payment
                  provider. Participant details are submitted to the Secretariat after payment.
                </p>
                <p className="rounded-md bg-muted px-3 py-2 text-sm font-semibold">
                  Estimated total:{" "}
                  {formatNaira(
                    q.data?.paymentRequired === false
                      ? 0
                      : (groupForm.participantType === "CORPORATE"
                          ? Number(q.data?.corporatePrice ?? 0)
                          : Number(q.data?.nonMemberPrice ?? 0)) * groupForm.quantity,
                  )}
                </p>
                <input
                  required
                  minLength={2}
                  maxLength={200}
                  className="w-full rounded-md border px-3 py-3"
                  placeholder="Organisation name"
                  value={groupForm.organisationName}
                  onChange={(event) =>
                    setGroupForm({ ...groupForm, organisationName: event.target.value })
                  }
                />
                <input
                  required
                  min={2}
                  max={500}
                  type="number"
                  className="w-full rounded-md border px-3 py-3"
                  placeholder="Number of participants"
                  value={groupForm.quantity}
                  onChange={(event) =>
                    setGroupForm({ ...groupForm, quantity: Number(event.target.value) })
                  }
                />
                <select
                  className="w-full rounded-md border px-3 py-3"
                  value={groupForm.participantType}
                  onChange={(event) =>
                    setGroupForm({
                      ...groupForm,
                      participantType: event.target.value as "GENERAL" | "CORPORATE",
                    })
                  }
                >
                  <option value="GENERAL">General group rate</option>
                  <option value="CORPORATE">Corporate group rate</option>
                </select>
                {[
                  ["contactName", "Coordinator name"],
                  ["contactEmail", "Coordinator email"],
                  ["contactPhone", "Coordinator phone"],
                ].map(([key, label]) => (
                  <input
                    key={key}
                    required
                    type={key === "contactEmail" ? "email" : "text"}
                    className="w-full rounded-md border px-3 py-3"
                    placeholder={label}
                    value={groupForm[key as keyof typeof groupForm]}
                    onChange={(event) => setGroupForm({ ...groupForm, [key]: event.target.value })}
                  />
                ))}
              </>
            )}
            {!q.data?.registrationClosed &&
            (isWaitlistInvitation || (!q.data?.soldOut && q.data?.registrationOpen)) &&
            payCfg.data ? (
              <PaymentMethodStep config={payCfg.data} value={method} onChange={setMethod} />
            ) : null}
            <Button
              loading={loading}
              disabled={
                q.data?.registrationClosed ||
                (registrationMode === "group" && (q.data?.soldOut || !q.data?.registrationOpen))
              }
              className="w-full gradient-brand text-white"
              onClick={() => {
                if (registrationMode === "group") {
                  const total =
                    (groupForm.participantType === "CORPORATE"
                      ? Number(q.data?.corporatePrice ?? 0)
                      : Number(q.data?.nonMemberPrice ?? 0)) * groupForm.quantity;
                  if (total > 0 && payCfg.data) void submit();
                  else if (total > 0) notify.error("Payment options are still loading.");
                  else void submit();
                } else void submit();
              }}
            >
              {q.data?.registrationClosed
                ? "Registration closed"
                : registrationMode === "group" && (q.data?.soldOut || !q.data?.registrationOpen)
                  ? "Bulk registration unavailable"
                  : !isWaitlistInvitation && (q.data?.soldOut || !q.data?.registrationOpen)
                    ? "Join waitlist"
                    : method === "BANK_TRANSFER"
                      ? "Continue to bank transfer"
                      : "Continue"}
            </Button>
          </>
        )}
        {group ? (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <p className="text-sm">
              Group reference: <strong>{group.registrationReference}</strong>
            </p>
            <Button
              type="button"
              variant="outline"
              loading={checkingGroup}
              onClick={() => void checkGroupStatus()}
            >
              Check payment status
            </Button>
            {groupStatus?.paid ? (
              groupStatus.whatsappUrl ? (
                <a
                  href={groupStatus.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[color:var(--brand-green)] px-5 py-3 font-semibold text-white"
                  onClick={(event) => void openGroupHandoff(event)}
                >
                  Continue to WhatsApp for participant onboarding
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">{groupStatus.fallbackInstructions}</p>
              )
            ) : null}
          </div>
        ) : null}
      </section>
    </SiteLayout>
  );
}
