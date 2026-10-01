import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, UserRound } from "lucide-react";
import { api, apiGet, apiPatch } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";
import { SelectOrOther } from "@/components/app/SelectOrOther";
import { notify } from "@/lib/toast";
import { initials } from "@/lib/format";

type ProfilePayload = {
  user: AuthUser & { avatarUrl?: string | null };
  profile: {
    personal: Record<string, string>;
    organisation: Record<string, string> | null;
    category: { slug: string; name: string } | null;
    passportUrl: string | null;
    applicationStatus: string | null;
  };
};

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

const READONLY_PERSONAL = [
  { key: "title", label: "Title" },
  { key: "middleName", label: "Middle name" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "gender", label: "Gender" },
  { key: "nationality", label: "Nationality" },
  { key: "state", label: "State" },
] as const;

export function ProfileEditor({ suite }: { suite: "portal" | "admin" }) {
  const { user, refreshUser, loading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState("");
  const [personal, setPersonal] = useState<Record<string, string>>({});
  const [passportUrl, setPassportUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const data = await apiGet<ProfilePayload>("/auth/me");
    setPhone(data.user.phone ?? "");
    setPersonal((data.profile?.personal as Record<string, string>) ?? {});
    setPassportUrl(data.profile?.passportUrl ?? data.user.avatarUrl ?? null);
    setCategory(data.profile?.category?.name ?? null);
    setAppStatus(data.profile?.applicationStatus ?? null);
  }

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  if (loading || !user) return null;

  async function save() {
    setSaving(true);
    try {
      await apiPatch("/auth/me", {
        phone: phone.trim() || null,
        personal: {
          address: personal.address ?? "",
          organisation: personal.organisation ?? "",
          jobTitle: personal.jobTitle ?? "",
          sector: personal.sector ?? "",
          years: personal.years ?? "",
        },
      });
      await refreshUser();
      await load();
      notify.success("Profile updated.");
    } finally {
      setSaving(false);
    }
  }

  async function onAvatar(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const data = await api<{ user: AuthUser; avatarUrl: string }>("/auth/me/avatar", { method: "POST", body });
      setPassportUrl(data.avatarUrl);
      await refreshUser();
      notify.success("Profile photo updated.");
    } finally {
      setUploading(false);
    }
  }

  const photo = passportUrl;
  const displayName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        icon={UserRound}
        title="Profile"
        subtitle={suite === "admin" ? "Your admin account and contact details." : "Account details and membership application information."}
      />

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            {photo ? (
              <img src={photo} alt="" className="h-24 w-24 rounded-2xl object-cover border border-border" />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-[color:var(--brand-tint)] text-2xl font-bold text-[color:var(--brand-deep)]">
                {initials(displayName)}
              </span>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute -bottom-2 left-1/2 -translate-x-1/2"
              loading={uploading}
              loadingText="…"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5" />
              Photo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onAvatar(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{displayName || user.email}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{user.role.replaceAll("_", " ")}</p>
            {category && <p className="mt-2 text-sm text-muted-foreground">Application category: {category}</p>}
            {appStatus && <p className="text-sm text-muted-foreground">Status: {appStatus.replaceAll("_", " ")}</p>}
            {uploading && (
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading photo…
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Editable details</h2>
          <p className="text-xs text-muted-foreground">Only phone, address, organisation, job title, sector and years of experience can be changed here.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2.5 text-sm" />
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">
            Address
            <textarea
              value={personal.address ?? ""}
              onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
              className="mt-1 min-h-20 w-full rounded-md border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm font-semibold">
            Organisation
            <input
              value={personal.organisation ?? ""}
              onChange={(e) => setPersonal({ ...personal, organisation: e.target.value })}
              className="mt-1 w-full rounded-md border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm font-semibold">
            Job title
            <input
              value={personal.jobTitle ?? ""}
              onChange={(e) => setPersonal({ ...personal, jobTitle: e.target.value })}
              className="mt-1 w-full rounded-md border px-3 py-2.5 text-sm"
            />
          </label>
          <SelectOrOther
            label="Sector"
            value={personal.sector ?? ""}
            options={SECTORS}
            onChange={(v) => setPersonal({ ...personal, sector: v })}
          />
          <SelectOrOther
            label="Years of experience"
            value={personal.years ?? ""}
            options={YEARS}
            onChange={(v) => setPersonal({ ...personal, years: v })}
          />
        </div>
        <Button loading={saving} loadingText="Saving…" className="gradient-brand text-white" onClick={() => void save()}>
          Save changes
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Locked identity</h2>
          <p className="text-xs text-muted-foreground">These fields come from your application and cannot be edited on profile.</p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">First name</dt>
            <dd className="mt-1 font-medium">{user.firstName || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Last name</dt>
            <dd className="mt-1 font-medium">{user.lastName || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Email</dt>
            <dd className="mt-1 font-medium break-all">{user.email}</dd>
          </div>
          {READONLY_PERSONAL.map((f) => (
            <div key={f.key}>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</dt>
              <dd className="mt-1 font-medium">{personal[f.key] || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
