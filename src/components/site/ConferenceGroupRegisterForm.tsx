import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { apiPost } from "@/lib/api";
import { startCheckout } from "@/lib/checkout";
import { formatNaira } from "@/lib/format";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { BankTransferCheckout, type BankTransferSession } from "@/components/payments/BankTransferCheckout";
import { PaymentMethodStep, type PaymentMethodChoice, type PublicPaymentsConfig } from "@/components/payments/PaymentMethodStep";

type GroupPackage = {
  slug: string;
  name: string;
  description?: string;
  amountNgn: number | string;
  participantType: string;
  maxGroupSize?: number | null;
};

type GroupConference = { slug: string; title: string; isFree: boolean };

type CreatedGroup = {
  id: string;
  registrationReference: string;
  quantity: number;
  unitPriceNgn: number;
  discountNgn: number;
  totalNgn: number;
  currency: string;
  paymentRequired: boolean;
};

type GroupStatus = {
  registrationReference: string;
  organisationName: string;
  conferenceTitle: string;
  packageName: string;
  quantity: number;
  unitPriceNgn: number;
  discountNgn: number;
  totalNgn: number;
  currency: string;
  paymentStatus: string;
  paid: boolean;
  whatsappUrl: string | null;
  handoffAt: string | null;
  fallbackInstructions: string;
};

export function ConferenceGroupRegisterForm({
  conference,
  slug,
  packages,
  paymentConfig,
  initialPackage,
  compact,
  onBack,
}: {
  conference: GroupConference;
  slug: string;
  packages: GroupPackage[];
  paymentConfig?: PublicPaymentsConfig;
  initialPackage: string;
  compact: boolean;
  onBack: () => void;
}) {
  const [packageSlug, setPackageSlug] = useState(initialPackage);
  const [quantity, setQuantity] = useState(2);
  const [method, setMethod] = useState<PaymentMethodChoice>("PAYSTACK");
  const [loading, setLoading] = useState(false);
  const [bankSession, setBankSession] = useState<BankTransferSession | null>(null);
  const [created, setCreated] = useState<CreatedGroup | null>(null);
  const [status, setStatus] = useState<GroupStatus | null>(null);
  const [form, setForm] = useState({
    organisationName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    city: "",
    country: "",
    purchaseOrder: "",
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [eventTermsConsent, setEventTermsConsent] = useState(false);
  const selectedPackage = packages.find((item) => item.slug === packageSlug) ?? packages[0];
  const unitPrice = conference.isFree ? 0 : Number(selectedPackage?.amountNgn ?? 0);
  const maxQuantity = selectedPackage?.maxGroupSize ?? 100;
  const total = Math.round(unitPrice * quantity * 100) / 100;

  useEffect(() => {
    if (paymentConfig) setMethod(paymentConfig.defaultMethod);
  }, [paymentConfig]);

  async function refreshStatus(reference = created?.registrationReference, email = form.contactEmail.trim().toLowerCase()) {
    if (!reference || !email) return;
    const data = await apiPost<GroupStatus>("/public/group-registrations/status", {
      registrationReference: reference,
      contactEmail: email,
    });
    setStatus(data);
    if (data.paid) setBankSession(null);
  }

  async function submit() {
    if (!selectedPackage) {
      notify.error("Select a registration category.");
      return;
    }
    if (!privacyConsent || !eventTermsConsent) {
      notify.error("Accept the Privacy Notice and event terms to continue.");
      return;
    }
    if (!form.organisationName.trim() || !form.contactName.trim() || !form.contactEmail.trim() || !form.contactPhone.trim()) {
      notify.error("Organisation, contact name, email and telephone are required.");
      return;
    }
    if (quantity < 2 || quantity > maxQuantity) {
      notify.error(`Enter a quantity between 2 and ${maxQuantity}.`);
      return;
    }
    setLoading(true);
    try {
      const createdGroup = await apiPost<CreatedGroup>(`/public/conferences/${encodeURIComponent(slug)}/groups`, {
        packageSlug: selectedPackage.slug,
        quantity,
        privacyConsent: true,
        eventTermsConsent: true,
        ...form,
      });
      setCreated(createdGroup);
      if (createdGroup.paymentRequired) {
        const checkout = await startCheckout({
          purpose: "CONFERENCE",
          linkedId: createdGroup.id,
          email: form.contactEmail.trim().toLowerCase(),
          method,
        });
        if (checkout.mode === "bank") {
          setBankSession(checkout.session);
          notify.success("Group registration saved. Complete the bank transfer; handoff unlocks after confirmation.");
          return;
        }
        if (checkout.cancelled) {
          notify.error("Payment was cancelled. Check out again using the same registration details.");
          return;
        }
        if (!checkout.verified) {
          notify.error("Payment could not yet be verified. Use Refresh payment status before contacting the Secretariat.");
          return;
        }
      }
      await refreshStatus(createdGroup.registrationReference, form.contactEmail.trim().toLowerCase());
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Group registration could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "space-y-4" : "mx-auto max-w-xl space-y-4"}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-[color:var(--brand-deep)]">Register as an Organisation / Group</h3>
        <Button size="sm" variant="outline" onClick={onBack}>Individual registration</Button>
      </div>
      {!created ? (
        <>
          {packages.length > 1 ? (
            <select
              className="w-full rounded-md border px-3 py-3"
              value={packageSlug}
              onChange={(event) => setPackageSlug(event.target.value)}
            >
              {packages.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name} · {formatNaira(Number(item.amountNgn))} per participant</option>
              ))}
            </select>
          ) : selectedPackage ? (
            <p className="rounded-lg border p-3 text-sm">{selectedPackage.name} · {formatNaira(unitPrice)} per participant</p>
          ) : null}
          {selectedPackage?.description ? <p className="text-sm text-muted-foreground">{selectedPackage.description}</p> : null}
          <label className="block text-sm font-medium">
            Number of participants (2–{maxQuantity})
            <input
              type="number"
              min={2}
              max={maxQuantity}
              step={1}
              value={quantity}
              className="mt-1 w-full rounded-md border px-3 py-3"
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>
          <div className="rounded-xl border bg-[color:var(--brand-tint)]/40 p-4 text-sm">
            <p>Unit price: <strong>{formatNaira(unitPrice)}</strong></p>
            <p>Discount: <strong>{formatNaira(0)}</strong></p>
            <p className="mt-1 text-base">Estimated total: <strong>{formatNaira(total)}</strong></p>
            <p className="mt-2 text-xs text-muted-foreground">The server recalculates the amount from the selected package and quantity before checkout. Review the posted refund policy and event terms before payment.</p>
          </div>
          {(
            [
              ["organisationName", "Organisation name", "text"],
              ["contactName", "Contact person", "text"],
              ["contactEmail", "Contact email", "email"],
              ["contactPhone", "Contact telephone", "tel"],
              ["city", "City (optional)", "text"],
              ["country", "Country (optional)", "text"],
              ["purchaseOrder", "Purchase order / internal reference (optional)", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <input
              key={key}
              type={type}
              placeholder={label}
              className="w-full rounded-md border px-3 py-3"
              value={form[key]}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            />
          ))}
          {total > 0 && paymentConfig ? (
            <PaymentMethodStep config={paymentConfig} value={method} onChange={setMethod} />
          ) : null}
          <div className="space-y-3 rounded-lg border p-4 text-sm text-muted-foreground">
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={privacyConsent} onChange={(event) => setPrivacyConsent(event.target.checked)} />
              <span>I agree to the <Link to="/legal/$slug" params={{ slug: "privacy-notice" }} className="font-semibold text-primary">Privacy Notice</Link>.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={eventTermsConsent} onChange={(event) => setEventTermsConsent(event.target.checked)} />
              <span>I accept the <Link to="/legal/$slug" params={{ slug: "terms-of-use" }} className="font-semibold text-primary">event terms</Link> and <Link to="/legal/$slug" params={{ slug: "refund-policy" }} className="font-semibold text-primary">refund policy</Link>.</span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">After verified payment, use the official WhatsApp handoff to send the participant list. Each row must include full name and email; telephone, organisation and job title are optional.</p>
          <Button loading={loading} className="w-full gradient-brand text-white" onClick={() => void submit()}>
            {total > 0 ? "Continue to group payment" : "Complete free group registration"}
          </Button>
        </>
      ) : (
        <div className="space-y-4 rounded-xl border p-4">
          <p className="font-semibold">{status?.paid ? "Payment confirmed" : "Registration submitted"}</p>
          <p className="text-sm">
            Reference <span className="font-mono font-semibold">{created.registrationReference}</span> · {created.quantity} places · {formatNaira(created.totalNgn)}
          </p>
          {!status?.paid ? (
            <div className="space-y-3">
              {bankSession ? (
                <BankTransferCheckout
                  session={bankSession}
                  onSubmitted={() => notify.success("Transfer receipt submitted; WhatsApp handoff will be available after Secretariat confirmation.")}
                />
              ) : null}
              <p className="text-sm text-muted-foreground">
                WhatsApp details are withheld until the payment provider confirms payment or the Secretariat approves an offline payment.
              </p>
              <Button size="sm" variant="outline" loading={loading} onClick={async () => {
                setLoading(true);
                try { await refreshStatus(); }
                catch (error) { notify.error(error instanceof Error ? error.message : "Could not refresh payment status."); }
                finally { setLoading(false); }
              }}>
                Refresh payment status
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {status.whatsappUrl ? (
                <a
                  href={status.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    void apiPost("/public/group-registrations/whatsapp-handoff", {
                      registrationReference: created.registrationReference,
                      contactEmail: form.contactEmail.trim().toLowerCase(),
                    }).catch(() => undefined);
                  }}
                  className="inline-flex rounded-md bg-[color:var(--brand-green)] px-4 py-2 font-semibold text-white"
                >
                  Send participant list via WhatsApp
                </a>
              ) : (
                <p className="text-sm text-amber-700">The official WhatsApp handoff is not configured. Use the fallback instructions below.</p>
              )}
              <p className="text-sm text-muted-foreground">{status.fallbackInstructions}</p>
              <p className="text-xs text-muted-foreground">Participant format: full name, email, telephone (optional), organisation (optional), job title (optional). Never send passwords, payment credentials or government ID numbers.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
