import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  CreditCard,
  FileText,
  FolderUp,
  ImageIcon,
  Layers,
  Loader2,
  Pencil,
  ScrollText,
  Upload,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loadPaymentsConfig, startCheckout } from "@/lib/checkout";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusChip } from "@/components/app/StatusChip";
import { SelectOrOther } from "@/components/app/SelectOrOther";
import { formatNaira } from "@/lib/format";
import { ApplyProgressBar } from "@/components/membership/ApplyProgressBar";
import { BankTransferCheckout, type BankTransferSession } from "@/components/payments/BankTransferCheckout";
import {
  PaymentMethodStep,
  resolveDefaultMethod,
  type PaymentMethodChoice,
} from "@/components/payments/PaymentMethodStep";

type Category = {
  slug: string;
  name: string;
  description: string;
  kind: string;
  currentFee: { amountNgn: number; year: number } | null;
};

type Application = {
  id: string;
  status: string;
  personal: Record<string, string>;
  organisation?: Record<string, string>;
  category: { slug: string; name: string };
  requiredDocuments: string[];
  missingDocuments: string[];
  documents: {
    id?: string;
    type: string;
    url: string;
    mime?: string;
    reviewStatus?: string;
    reviewNote?: string | null;
  }[];
};

const TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof", "Engr", "Barr", "Chief", "Other"];
const GENDERS = ["Male", "Female", "Prefer not to say", "Other"];
const NATIONALITIES = ["Nigerian", "Other"];
const SECTORS = [
  "Public sector / Government",
  "Banking & Financial services",
  "Telecommunications",
  "Technology / Software",
  "Healthcare",
  "Education",
  "Oil & Gas / Energy",
  "Legal / Professional services",
  "NGO / Development",
  "Manufacturing",
  "Media & Communications",
  "Other",
];
const YEARS = ["0–2", "3–5", "6–10", "11–15", "16–20", "21+", "Other"];
const NG_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT — Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "Other",
];

const STEP_LABELS = ["Category", "Details", "Documents", "Declaration & review", "Payment"];

const TRACKER_STEPS = [
  {
    id: 1,
    title: "Category",
    detail: "Choose the membership track that matches your role and experience.",
    icon: Layers,
  },
  {
    id: 2,
    title: "Personal & professional details",
    detail: "Identity, contact and workplace information for Secretariat review.",
    icon: UserRound,
  },
  {
    id: 3,
    title: "Supporting documents",
    detail: "Upload passport photo and required certificates or organisational papers.",
    icon: FolderUp,
  },
  {
    id: 4,
    title: "Declaration & review",
    detail: "Confirm accuracy, accept ethics terms, and review every answer.",
    icon: ScrollText,
  },
  {
    id: 5,
    title: "Payment",
    detail: "Pay the published fee securely with Paystack to submit for review.",
    icon: CreditCard,
  },
];

function fieldLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function DocUploadCard({
  type,
  existingUrl,
  uploading,
  onPick,
  reviewStatus,
  reviewNote,
  canReplace = true,
}: {
  type: string;
  existingUrl?: string;
  uploading: boolean;
  onPick: (file: File) => void;
  reviewStatus?: string;
  reviewNote?: string | null;
  canReplace?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [localName, setLocalName] = useState<string | null>(null);
  const preview = localPreview || existingUrl;
  const isImage = preview ? /\.(jpe?g|png|gif|webp)(\?|$)/i.test(preview) || preview.startsWith("blob:") : false;
  const statusTone =
    reviewStatus === "APPROVED" ? "success" : reviewStatus === "REJECTED" ? "danger" : reviewStatus === "PENDING" ? "warning" : "muted";

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {type === "PASSPORT_PHOTO" ? "Profile photo" : type.replaceAll("_", " ")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {type === "PASSPORT_PHOTO" ? "Shown on your profile and membership card" : "JPEG, PNG, PDF or DOCX"}
          </p>
          {reviewStatus && (
            <div className="mt-2">
              <StatusChip tone={statusTone}>{reviewStatus.replaceAll("_", " ")}</StatusChip>
            </div>
          )}
        </div>
        {canReplace && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={uploading}
            loadingText="Uploading…"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {existingUrl || localPreview ? "Replace" : "Upload"}
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf,.docx"
          className="hidden"
          disabled={!canReplace}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
            setLocalName(f.name);
            setLocalPreview(URL.createObjectURL(f));
            onPick(f);
            e.target.value = "";
          }}
        />
      </div>
      {reviewStatus === "REJECTED" && reviewNote && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive whitespace-pre-wrap">{reviewNote}</p>
      )}
      {uploading && (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
        </p>
      )}
      {preview && !uploading && (
        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-muted/40">
          {isImage ? (
            <img src={preview} alt={type} className="max-h-40 w-full object-contain" />
          ) : (
            <div className="flex items-center gap-2 px-3 py-4 text-sm">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="truncate">{localName || "Document uploaded"}</span>
              {existingUrl && (
                <a href={existingUrl} target="_blank" rel="noreferrer" className="ml-auto text-[color:var(--brand-green)] underline">
                  View
                </a>
              )}
            </div>
          )}
        </div>
      )}
      {!preview && !uploading && canReplace && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-sm text-muted-foreground hover:bg-muted/40"
        >
          <ImageIcon className="h-6 w-6" />
          Choose a file to upload
        </button>
      )}
    </div>
  );
}

export function MembershipApplyWizard({
  preselect,
  embedded = false,
}: {
  preselect?: string;
  embedded?: boolean;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/public/membership-categories"),
  });
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethodChoice>("PAYSTACK");
  const [bankSession, setBankSession] = useState<BankTransferSession | null>(null);
  const payCfg = useQuery({ queryKey: ["payments-config"], queryFn: () => loadPaymentsConfig() });

  useEffect(() => {
    if (payCfg.data) setPayMethod(resolveDefaultMethod(payCfg.data));
  }, [payCfg.data]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [declared, setDeclared] = useState(false);
  const [app, setApp] = useState<Application | null>(null);
  const [personal, setPersonal] = useState<Record<string, string>>({
    title: "",
    firstName: user?.firstName ?? "",
    middleName: "",
    surname: user?.lastName ?? "",
    dateOfBirth: "",
    gender: "",
    nationality: "Nigerian",
    state: "",
    phone: user?.phone ?? "",
    address: "",
    organisation: "",
    jobTitle: "",
    sector: "",
    years: "",
  });
  const [org, setOrg] = useState({ name: "", cacNumber: "" });
  const [slug, setSlug] = useState(preselect ?? "professional");

  useEffect(() => {
    if (!loading && !user && !embedded) {
      void navigate({
        to: "/register",
        search: { redirect: "/membership/apply", ...(preselect ? { category: preselect } : {}) },
      });
    }
  }, [loading, user, navigate, preselect, embedded]);

  useEffect(() => {
    if (!user) return;
    apiGet<Application | null>("/membership/applications/me").then((existing) => {
      if (existing) {
        setApp(existing);
        setSlug(existing.category.slug);
        setPersonal((p) => ({ ...p, ...(existing.personal ?? {}) }));
        if (existing.organisation) setOrg({ name: existing.organisation.name ?? "", cacNumber: existing.organisation.cacNumber ?? "" });
      }
    });
  }, [user]);

  const selected = cats.data?.find((c) => c.slug === slug);
  const docsByType = useMemo(() => {
    const map = new Map<string, Application["documents"][number]>();
    for (const d of app?.documents ?? []) map.set(d.type, d);
    return map;
  }, [app]);

  function setField(key: string, value: string) {
    setPersonal((p) => ({ ...p, [key]: value }));
  }

  async function saveDraft(nextStep?: number) {
    setSaving(true);
    try {
      const payload = {
        categorySlug: slug,
        personal,
        organisation: selected?.kind === "ORGANISATION" ? org : undefined,
      };
      const data = app
        ? await apiPatch<Application>(`/membership/applications/${app.id}`, payload)
        : await apiPost<Application>("/membership/applications", payload);
      setApp(data);
      notify.success("Progress saved.");
      if (nextStep) setStep(nextStep);
    } finally {
      setSaving(false);
    }
  }

  async function acceptDeclarations() {
    if (!app) {
      notify.error("Save your application first.");
      return;
    }
    if (!declared) {
      notify.error("Please confirm the declaration before continuing.");
      return;
    }
    setSaving(true);
    try {
      const data = await apiPatch<Application>(`/membership/applications/${app.id}`, {
        categorySlug: slug,
        personal,
        organisation: selected?.kind === "ORGANISATION" ? org : undefined,
        declarationAccepted: true,
        ethicsAccepted: true,
        privacyAccepted: true,
      });
      setApp(data);
      setStep(5);
    } finally {
      setSaving(false);
    }
  }

  async function payNow() {
    if (!app) return;
    setPaying(true);
    try {
      await apiPatch(`/membership/applications/${app.id}`, {
        categorySlug: slug,
        personal,
        organisation: selected?.kind === "ORGANISATION" ? org : undefined,
        declarationAccepted: true,
        ethicsAccepted: true,
        privacyAccepted: true,
      });
      const pay = await startCheckout({
        purpose: "MEMBERSHIP_APPLICATION",
        linkedId: app.id,
        method: payMethod,
      });
      if (pay.mode === "bank") {
        setBankSession(pay.session);
        notify.success("Complete bank transfer and upload your receipt.");
        return;
      }
      if (pay.verified) {
        notify.success("Payment confirmed.");
        notify.success("Application submitted for review.");
        await navigate({ to: "/portal/application" });
      } else if (pay.cancelled) {
        notify.error("Payment was cancelled.");
      }
    } finally {
      setPaying(false);
    }
  }

  async function upload(type: string, file: File) {
    if (!app) {
      notify.error("Save your details first.");
      return;
    }
    setUploadingType(type);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("type", type);
      await api(`/membership/applications/${app.id}/documents`, { method: "POST", body });
      notify.success(type === "PASSPORT_PHOTO" ? "Profile photo uploaded." : "Document uploaded.");
      const fresh = await apiGet<Application>("/membership/applications/me");
      setApp(fresh);
    } finally {
      setUploadingType(null);
    }
  }

  if (loading || cats.isPending) {
    return <Skeleton className="h-96" />;
  }

  const reviewRows: { label: string; value: string; step: number }[] = [
    { label: "Category", value: selected?.name ?? slug, step: 1 },
    ...Object.entries(personal)
      .filter(([, v]) => v)
      .map(([k, v]) => ({ label: fieldLabel(k), value: v, step: 2 })),
    ...(selected?.kind === "ORGANISATION"
      ? [
          { label: "Organisation name", value: org.name, step: 2 },
          { label: "CAC number", value: org.cacNumber, step: 2 },
        ].filter((r) => r.value)
      : []),
  ];

  return (
    <div className={embedded ? "space-y-6" : ""}>
      {embedded ? (
        <PageHeader
          icon={BadgeCheck}
          title="Membership application"
          subtitle="Complete each stage below. Your progress is saved as you continue."
        />
      ) : null}
      <div className="space-y-6">
        <ApplyProgressBar
          steps={[
            { id: 1, title: "Category", icon: Layers },
            { id: 2, title: "Details", icon: UserRound },
            { id: 3, title: "Documents", icon: FolderUp },
            { id: 4, title: "Review", icon: ScrollText },
            { id: 5, title: "Payment", icon: CreditCard },
          ]}
          current={step}
        />
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
          <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
            {(() => {
              const Meta = TRACKER_STEPS[step - 1];
              const Icon = Meta.icon;
              return (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Stage {step} of 5 · {STEP_LABELS[step - 1]}
                    </p>
                    <h2 className="mt-1 text-xl font-bold">{Meta.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{Meta.detail}</p>
                  </div>
                </>
              );
            })()}
          </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {cats.data?.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setSlug(c.slug)}
                  className={`rounded-xl border p-4 text-left transition ${
                    slug === c.slug
                      ? "border-[color:var(--brand-emerald)] bg-[color:var(--brand-tint)] "
                      : "bg-background hover:border-[color:var(--brand-emerald)]/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                      <Briefcase className="h-4 w-4 text-[color:var(--brand-deep)]" />
                    </span>
                    {slug === c.slug ? <CheckCircle2 className="h-5 w-5 text-[color:var(--brand-emerald)]" /> : null}
                  </div>
                  <p className="mt-3 font-bold text-[color:var(--brand-deep)]">{c.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                  <p className="mt-3 text-sm font-semibold">
                    {c.currentFee ? `${formatNaira(c.currentFee.amountNgn)} · ${c.currentFee.year}` : "Fee on application"}
                  </p>
                </button>
              ))}
            </div>
            <Button loading={saving} loadingText="Saving…" className="gradient-brand text-white" onClick={() => void saveDraft(2)}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <SelectOrOther label="Title" value={personal.title ?? ""} options={TITLES} onChange={(v) => setField("title", v)} />
            <label className="block text-sm font-semibold">
              First name
              <input
                value={personal.firstName ?? ""}
                onChange={(e) => setField("firstName", e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2.5 text-base md:text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              Middle name
              <input
                value={personal.middleName ?? ""}
                onChange={(e) => setField("middleName", e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2.5 text-base md:text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              Surname
              <input
                value={personal.surname ?? ""}
                onChange={(e) => setField("surname", e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2.5 text-base md:text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              Date of birth
              <input
                type="date"
                value={personal.dateOfBirth ?? ""}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2.5 text-base md:text-sm"
              />
            </label>
            <SelectOrOther label="Gender" value={personal.gender ?? ""} options={GENDERS} onChange={(v) => setField("gender", v)} />
            <SelectOrOther
              label="Nationality"
              value={personal.nationality ?? ""}
              options={NATIONALITIES}
              onChange={(v) => setField("nationality", v)}
            />
            <SelectOrOther label="State" value={personal.state ?? ""} options={NG_STATES} onChange={(v) => setField("state", v)} />
            <label className="block text-sm font-semibold">
              Phone
              <input
                value={personal.phone ?? ""}
                onChange={(e) => setField("phone", e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2.5 text-base md:text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              Address
              <textarea
                value={personal.address ?? ""}
                onChange={(e) => setField("address", e.target.value)}
                className="mt-1 min-h-20 w-full rounded-md border px-3 py-2.5 text-base md:text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              Organisation
              <input
                value={personal.organisation ?? ""}
                onChange={(e) => setField("organisation", e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2.5 text-base md:text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              Job title
              <input
                value={personal.jobTitle ?? ""}
                onChange={(e) => setField("jobTitle", e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2.5 text-base md:text-sm"
              />
            </label>
            <SelectOrOther label="Sector" value={personal.sector ?? ""} options={SECTORS} onChange={(v) => setField("sector", v)} />
            <SelectOrOther
              label="Years of experience"
              value={personal.years ?? ""}
              options={YEARS}
              onChange={(v) => setField("years", v)}
            />
            {selected?.kind === "ORGANISATION" && (
              <>
                <label className="block text-sm font-semibold">
                  Organisation legal name
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2.5"
                    value={org.name}
                    onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  CAC number
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2.5"
                    value={org.cacNumber}
                    onChange={(e) => setOrg({ ...org, cacNumber: e.target.value })}
                  />
                </label>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button loading={saving} loadingText="Saving…" className="gradient-brand text-white" onClick={() => void saveDraft(3)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload each required document. After payment, rejected files can be replaced from here or your application status page.
            </p>
            <div className="space-y-3">
              {(app?.requiredDocuments ?? ["PASSPORT_PHOTO"]).map((type) => {
                const doc = docsByType.get(type);
                const approved = doc?.reviewStatus === "APPROVED";
                const canReplace =
                  !approved &&
                  (!doc ||
                    !doc.reviewStatus ||
                    doc.reviewStatus === "REJECTED" ||
                    ["DRAFT", "PAYMENT_PENDING", "INFO_REQUESTED"].includes(app?.status ?? "DRAFT"));
                return (
                  <DocUploadCard
                    key={type}
                    type={type}
                    existingUrl={doc?.url}
                    uploading={uploadingType === type}
                    reviewStatus={doc?.reviewStatus}
                    reviewNote={doc?.reviewNote}
                    canReplace={canReplace}
                    onPick={(file) => void upload(type, file)}
                  />
                );
              })}
            </div>
            {(app?.missingDocuments?.length ?? 0) > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Still needed: {app?.missingDocuments.join(", ")}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                className="gradient-brand text-white"
                disabled={uploadingType !== null}
                onClick={() => setStep(4)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Review everything below. Use Edit to jump back to the exact step.
            </p>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Application details</h3>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                {reviewRows.map((row) => (
                  <div key={`${row.label}-${row.step}`} className="min-w-0 rounded-lg bg-muted/40 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.label}</dt>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--brand-green)] hover:underline"
                        onClick={() => setStep(row.step)}
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    </div>
                    <dd className="mt-1 break-words text-sm font-medium">{row.value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Uploads</h3>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--brand-green)] hover:underline"
                  onClick={() => setStep(3)}
                >
                  <Pencil className="h-3 w-3" /> Edit documents
                </button>
              </div>
              {(app?.documents ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {(app?.documents ?? []).map((d) => (
                    <li key={`${d.type}-${d.url}`} className="overflow-hidden rounded-lg border border-border">
                      <p className="border-b border-border px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {d.type.replaceAll("_", " ")}
                      </p>
                      {/\.(jpe?g|png|gif|webp)(\?|$)/i.test(d.url) ? (
                        <img src={d.url} alt={d.type} className="max-h-36 w-full object-contain bg-background" />
                      ) : (
                        <a href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-3 text-sm hover:underline">
                          <FileText className="h-4 w-4" /> View document
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <label className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm leading-relaxed">
              <input
                type="checkbox"
                className="mt-1"
                checked={declared}
                onChange={(e) => setDeclared(e.target.checked)}
              />
              <span>
                I declare that the information provided is accurate and complete. I agree to the DPO Conference Code of Ethics,
                Membership Terms and Privacy Notice
                {embedded ? (
                  <>
                    {" "}
                    (see{" "}
                    <Link to="/portal/privacy" className="underline">
                      Privacy
                    </Link>
                    ).
                  </>
                ) : (
                  <>
                    {" "}
                    (
                    <Link to="/legal/$slug" params={{ slug: "code-of-ethics" }} className="underline">
                      Code of Ethics
                    </Link>
                    ,{" "}
                    <Link to="/legal/$slug" params={{ slug: "membership-terms" }} className="underline">
                      Membership Terms
                    </Link>
                    ,{" "}
                    <Link to="/legal/$slug" params={{ slug: "privacy-notice" }} className="underline">
                      Privacy Notice
                    </Link>
                    ).
                  </>
                )}
              </span>
            </label>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                loading={saving}
                loadingText="Saving…"
                className="gradient-brand text-white"
                onClick={() => void acceptDeclarations()}
              >
                Continue to payment
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Membership fee</p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight text-[color:var(--brand-deep)]">
                      {selected?.currentFee ? formatNaira(selected.currentFee.amountNgn) : "See checkout"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selected?.name}
                      {selected?.currentFee ? ` · ${selected.currentFee.year}` : ""}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-[color:var(--brand-emerald)]" />
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Pay by card (Paystack) or bank transfer when enabled by the Secretariat.</li>
                  <li>• Payment is required before Secretariat review.</li>
                  <li>• You will receive a receipt after a successful payment (or after bank confirmation).</li>
                  <li>• Amount is taken from the current admin-configured fee.</li>
                </ul>
                <div className="rounded-xl border border-border bg-card/80 px-3 py-2 text-sm">
                  <p>
                    Applicant:{" "}
                    <strong>
                      {[personal.title, personal.firstName, personal.surname].filter(Boolean).join(" ") || user?.name}
                    </strong>
                  </p>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                {bankSession ? (
                  <BankTransferCheckout
                    session={bankSession}
                    onSubmitted={() => {
                      notify.success("Receipt submitted. Application moves to review after confirmation.");
                      void navigate({ to: "/portal/application" });
                    }}
                  />
                ) : payCfg.data ? (
                  <PaymentMethodStep config={payCfg.data} value={payMethod} onChange={setPayMethod} />
                ) : null}
              </div>
            </div>
            {!bankSession ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setStep(4)}>
                  Back
                </Button>
                <Button
                  loading={paying}
                  loadingText="Starting checkout…"
                  className="min-w-48 gradient-brand text-white"
                  onClick={() => void payNow()}
                >
                  {payMethod === "BANK_TRANSFER" ? "Continue to bank transfer" : "Pay with Paystack"}
                </Button>
              </div>
            ) : null}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
