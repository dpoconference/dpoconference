import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { RichMediaFields } from "@/components/app/RichMediaFields";
import { conferenceNightDayCount, formatNaira } from "@/lib/format";
import { apiUpload } from "@/lib/upload";

type AgendaItem = { time: string; title: string; description: string };
type AgendaDay = { date: string; title: string; items: AgendaItem[] };

function buildAgendaDaysFromDates(startsOn: string, endsOn: string): AgendaDay[] {
  const s = new Date(startsOn);
  const e = new Date(endsOn);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return [];
  const days: AgendaDay[] = [];
  const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const end = new Date(e.getFullYear(), e.getMonth(), e.getDate());
  let n = 1;
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    days.push({ date: `${y}-${m}-${d}`, title: `Day ${n}`, items: [] });
    cur.setDate(cur.getDate() + 1);
    n += 1;
  }
  return days;
}

function emptyPackageForm(conferenceId = "") {
  return {
    conferenceId,
    name: "",
    slug: "",
    participantType: "GENERAL",
    amountNgn: "",
    description: "",
    salesOpenOn: "",
    salesCloseOn: "",
    capacity: "",
    isActive: true,
    isVisible: true,
  };
}

export const Route = createFileRoute("/admin/events")({
  component: Page,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function toIso(local: string) {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function fromIso(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Conference = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  overview: string;
  bodyHtml?: string;
  coverUrl?: string | null;
  prospectusUrl?: string | null;
  startsOn: string;
  endsOn: string;
  venue: string;
  city: string;
  format: string;
  isPublished: boolean;
  isArchived?: boolean;
  isFree?: boolean;
  capacity?: number | null;
  agenda?: AgendaDay[] | null;
  datesToBeAnnounced?: boolean;
  registrationOpensOn?: string | null;
  registrationClosesOn?: string | null;
  _count: { registrations: number };
  packages: {
    id: string;
    name: string;
    slug: string;
    description: string;
    participantType: string;
    amountNgn: string;
    salesOpenOn?: string | null;
    salesCloseOn?: string | null;
    capacity?: number | null;
    isActive: boolean;
    isVisible?: boolean;
  }[];
};

type Seminar = {
  id: string;
  slug: string;
  title: string;
  description: string;
  bodyHtml?: string;
  coverUrl?: string | null;
  startsOn: string;
  endsOn: string;
  durationHours: string;
  venue: string;
  capacity: number;
  audience: string;
  facilitator?: string | null;
  outcomes?: string | null;
  certificateAvailable?: boolean;
  memberPrice: string;
  nonMemberPrice: string;
  corporatePrice: string;
  paymentRequired: boolean;
  cpdPoints: number;
  isPublished: boolean;
  isCorporateEvent: boolean;
  materials?: { id: string; title: string; url: string }[];
};

function Page() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("events.manage");
  const [tab, setTab] = useState<"setup" | "regs">("setup");
  const [loading, setLoading] = useState(false);
  const prospectusRef = useRef<HTMLInputElement>(null);

  const dash = useQuery({
    queryKey: ["ev-dash"],
    queryFn: () =>
      apiGet<{
        conference: {
          paidCount: number;
          revenue: number;
          byType: { participantType: string; status: string; _count: number }[];
        };
        seminar: {
          paidCount: number;
          revenue: number;
          byType: { participantType: string; _count: number }[];
        };
        recent: { id: string; name: string; event: string; status: string }[];
      }>("/admin/events/dashboard"),
  });
  const conferences = useQuery({
    queryKey: ["admin-conferences"],
    queryFn: () => apiGet<Conference[]>("/admin/events/conferences"),
    enabled: canManage,
  });
  const seminars = useQuery({
    queryKey: ["admin-seminars"],
    queryFn: () => apiGet<Seminar[]>("/admin/events/seminars"),
    enabled: canManage,
  });
  const regs = useQuery({
    queryKey: ["sem-regs"],
    queryFn: () =>
      apiGet<
        {
          id: string;
          registrationNumber: string;
          participantType: string;
          attendanceStatus: string;
          name: string;
          email: string;
          phone?: string;
          organisation?: string;
          amountNgn: number;
          paymentStatus: string;
          seminar: { title: string };
        }[]
      >("/admin/events/seminars/registrations"),
  });
  const confRegs = useQuery({
    queryKey: ["conf-regs"],
    queryFn: () =>
      apiGet<
        {
          id: string;
          registrationNumber: string;
          participantType: string;
          status: string;
          attendanceStatus?: string;
          name: string;
          email: string;
          phone?: string;
          organisation?: string;
          amountNgn: number;
          paymentStatus: string;
          packageName?: string;
          conference: { title: string };
        }[]
      >("/admin/events/conferences/registrations"),
  });

  const [confForm, setConfForm] = useState({
    slug: "",
    title: "",
    theme: "",
    overview: "",
    bodyHtml: "",
    coverUrl: "",
    prospectusUrl: "",
    startsOn: "",
    endsOn: "",
    venue: "",
    city: "",
    format: "To be announced",
    isPublished: false,
    isFree: false,
    capacity: "",
    agenda: [] as AgendaDay[],
    registrationOpensOn: "",
    registrationClosesOn: "",
    datesToBeAnnounced: false,
    eventYear: "2027",
  });
  const [pkgForm, setPkgForm] = useState(() => emptyPackageForm());
  const [editingPackageId, setEditingPackageId] = useState("");
  const nightDay = useMemo(() => {
    if (!confForm.startsOn || !confForm.endsOn) return null;
    return conferenceNightDayCount(confForm.startsOn, confForm.endsOn);
  }, [confForm.startsOn, confForm.endsOn]);
  const [semForm, setSemForm] = useState({
    slug: "",
    title: "",
    description: "",
    bodyHtml: "",
    coverUrl: "",
    startsOn: "",
    endsOn: "",
    durationHours: "4",
    venue: "",
    capacity: "50",
    audience: "",
    facilitator: "",
    outcomes: "",
    certificateAvailable: false,
    memberPrice: "0",
    nonMemberPrice: "25000",
    corporatePrice: "100000",
    paymentRequired: true,
    cpdPoints: "2",
    isPublished: false,
    isCorporateEvent: false,
  });
  const [override, setOverride] = useState({ id: "", amountNgn: "", reason: "" });
  const [materialForm, setMaterialForm] = useState({ seminarId: "", title: "", url: "" });

  if (dash.isPending) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        subtitle="Create conferences and seminars, manage packages, and mark attendance."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Conference paid</p>
          <p className="mt-1 text-lg font-semibold">{dash.data?.conference.paidCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Conference revenue
          </p>
          <p className="mt-1 text-lg font-semibold">
            ₦{(dash.data?.conference.revenue ?? 0).toLocaleString("en-NG")}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Seminar paid</p>
          <p className="mt-1 text-lg font-semibold">{dash.data?.seminar.paidCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Seminar revenue</p>
          <p className="mt-1 text-lg font-semibold">
            ₦{(dash.data?.seminar.revenue ?? 0).toLocaleString("en-NG")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={tab === "setup" ? "default" : "outline"}
          onClick={() => setTab("setup")}
        >
          Setup
        </Button>
        <Button
          size="sm"
          variant={tab === "regs" ? "default" : "outline"}
          onClick={() => setTab("regs")}
        >
          Registrations
        </Button>
      </div>

      {tab === "setup" && canManage && (
        <div className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <form
              className="space-y-3 rounded-2xl border border-border bg-card p-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const year = Number(confForm.eventYear);
                  const startsOn = confForm.datesToBeAnnounced
                    ? Number.isInteger(year) && year >= 2026 && year <= 2100
                      ? new Date(Date.UTC(year, 0, 1)).toISOString()
                      : undefined
                    : toIso(confForm.startsOn);
                  const endsOn = confForm.datesToBeAnnounced
                    ? Number.isInteger(year) && year >= 2026 && year <= 2100
                      ? new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString()
                      : undefined
                    : toIso(confForm.endsOn);
                  if (!startsOn || !endsOn) throw new Error("Dates required");
                  await apiPost("/admin/events/conferences", {
                    slug: confForm.slug || slugify(confForm.title),
                    title: confForm.title,
                    theme: confForm.theme,
                    overview: confForm.overview,
                    bodyHtml: confForm.bodyHtml,
                    coverUrl: confForm.coverUrl || undefined,
                    prospectusUrl: confForm.prospectusUrl || undefined,
                    startsOn,
                    endsOn,
                    venue: confForm.venue,
                    city: confForm.city,
                    format: confForm.format,
                    isPublished: confForm.isPublished,
                    isFree: confForm.isFree,
                    datesToBeAnnounced: confForm.datesToBeAnnounced,
                    capacity: confForm.capacity.trim() ? Number(confForm.capacity) : null,
                    agenda: confForm.agenda.map((day) => ({
                      date: day.date,
                      title: day.title,
                      items: (day.items ?? [])
                        .filter((item) => item.title.trim())
                        .map((item) => ({
                          time: item.time,
                          title: item.title,
                          description: item.description,
                        })),
                    })),
                    registrationOpensOn: toIso(confForm.registrationOpensOn),
                    registrationClosesOn: toIso(confForm.registrationClosesOn),
                  });
                  notify.success("Conference saved.");
                  await conferences.refetch();
                } catch (err) {
                  notify.error(err instanceof Error ? err.message : "Could not save conference.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <h3 className="font-semibold">Conference</h3>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
                placeholder="Title"
                value={confForm.title}
                onChange={(e) =>
                  setConfForm({
                    ...confForm,
                    title: e.target.value,
                    slug: confForm.slug || slugify(e.target.value),
                  })
                }
              />
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
                placeholder="slug"
                value={confForm.slug}
                onChange={(e) => setConfForm({ ...confForm, slug: e.target.value })}
              />
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Theme"
                value={confForm.theme}
                onChange={(e) => setConfForm({ ...confForm, theme: e.target.value })}
              />
              <textarea
                className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Overview (short)"
                value={confForm.overview}
                onChange={(e) => setConfForm({ ...confForm, overview: e.target.value })}
              />
              <RichMediaFields
                folder="ndpo/events"
                coverUrl={confForm.coverUrl}
                bodyHtml={confForm.bodyHtml}
                onCoverChange={(coverUrl) => setConfForm({ ...confForm, coverUrl })}
                onBodyChange={(bodyHtml) => setConfForm({ ...confForm, bodyHtml })}
                coverLabel="Conference banner / cover"
                bodyLabel="Full details"
              />
              <div className="space-y-2">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Sponsorship prospectus URL"
                  value={confForm.prospectusUrl}
                  onChange={(e) => setConfForm({ ...confForm, prospectusUrl: e.target.value })}
                />
                <input
                  ref={prospectusRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const up = await apiUpload(file, "ndpo/events");
                      setConfForm((f) => ({ ...f, prospectusUrl: up.url }));
                      notify.success("Prospectus uploaded.");
                    } catch (err) {
                      notify.error(err instanceof Error ? err.message : "Upload failed.");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => prospectusRef.current?.click()}
                >
                  Upload prospectus PDF
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {confForm.datesToBeAnnounced ? (
                  <label className="text-xs">
                    Conference year
                    <input
                      type="number"
                      min={2026}
                      max={2100}
                      className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
                      required
                      value={confForm.eventYear}
                      onChange={(e) => setConfForm({ ...confForm, eventYear: e.target.value })}
                    />
                  </label>
                ) : (
                  <>
                    <label className="text-xs">
                      Starts
                      <input
                        type="datetime-local"
                        className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
                        required
                        value={confForm.startsOn}
                        onChange={(e) => setConfForm({ ...confForm, startsOn: e.target.value })}
                      />
                    </label>
                    <label className="text-xs">
                      Ends
                      <input
                        type="datetime-local"
                        className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
                        required
                        value={confForm.endsOn}
                        onChange={(e) => setConfForm({ ...confForm, endsOn: e.target.value })}
                      />
                    </label>
                  </>
                )}
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={confForm.datesToBeAnnounced}
                    onChange={(e) =>
                      setConfForm({ ...confForm, datesToBeAnnounced: e.target.checked })
                    }
                  />
                  Exact dates to be announced
                </label>
              </div>
              {confForm.datesToBeAnnounced ? (
                <p className="text-xs text-muted-foreground">
                  The public event page will show only the selected year, not placeholder dates.
                </p>
              ) : null}
              {nightDay ? (
                <p className="text-xs text-muted-foreground">
                  {nightDay.days} day{nightDay.days === 1 ? "" : "s"} · {nightDay.nights} night
                  {nightDay.nights === 1 ? "" : "s"}
                </p>
              ) : null}
              <label className="block text-xs">
                Format
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  aria-label="Conference format"
                  placeholder="e.g. Hybrid, Online, In-person, or To be announced"
                  value={confForm.format}
                  onChange={(e) => setConfForm({ ...confForm, format: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-md border px-3 py-2 text-sm"
                  required
                  placeholder="Venue"
                  value={confForm.venue}
                  onChange={(e) => setConfForm({ ...confForm, venue: e.target.value })}
                />
                <input
                  className="rounded-md border px-3 py-2 text-sm"
                  required
                  placeholder="City"
                  value={confForm.city}
                  onChange={(e) => setConfForm({ ...confForm, city: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={confForm.isFree}
                    onChange={(e) => setConfForm({ ...confForm, isFree: e.target.checked })}
                  />
                  Free event
                </label>
                <input
                  className="rounded-md border px-3 py-2 text-sm"
                  type="number"
                  min={1}
                  placeholder="Capacity (optional)"
                  value={confForm.capacity}
                  onChange={(e) => setConfForm({ ...confForm, capacity: e.target.value })}
                />
              </div>
              <div className="space-y-2 rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Agenda</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!confForm.startsOn || !confForm.endsOn) {
                        notify.error("Set start and end dates first.");
                        return;
                      }
                      setConfForm({
                        ...confForm,
                        agenda: buildAgendaDaysFromDates(confForm.startsOn, confForm.endsOn),
                      });
                    }}
                  >
                    Build days from dates
                  </Button>
                </div>
                {(confForm.agenda ?? []).map((day, dayIdx) => (
                  <div
                    key={`${day.date}-${dayIdx}`}
                    className="space-y-2 rounded-md border border-dashed p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        className="rounded-md border px-2 py-1.5 text-sm"
                        value={day.title}
                        placeholder="Day title"
                        onChange={(e) => {
                          const agenda = [...confForm.agenda];
                          agenda[dayIdx] = { ...day, title: e.target.value };
                          setConfForm({ ...confForm, agenda });
                        }}
                      />
                      <input
                        className="rounded-md border px-2 py-1.5 text-sm"
                        type="date"
                        value={day.date}
                        onChange={(e) => {
                          const agenda = [...confForm.agenda];
                          agenda[dayIdx] = { ...day, date: e.target.value };
                          setConfForm({ ...confForm, agenda });
                        }}
                      />
                    </div>
                    {(day.items ?? []).map((item, itemIdx) => (
                      <div key={itemIdx} className="grid gap-2 sm:grid-cols-[7rem_1fr_auto]">
                        <input
                          className="rounded-md border px-2 py-1.5 text-sm"
                          placeholder="Time"
                          value={item.time}
                          onChange={(e) => {
                            const agenda = [...confForm.agenda];
                            const items = [...(day.items ?? [])];
                            items[itemIdx] = { ...item, time: e.target.value };
                            agenda[dayIdx] = { ...day, items };
                            setConfForm({ ...confForm, agenda });
                          }}
                        />
                        <input
                          className="rounded-md border px-2 py-1.5 text-sm"
                          placeholder="Session title"
                          value={item.title}
                          onChange={(e) => {
                            const agenda = [...confForm.agenda];
                            const items = [...(day.items ?? [])];
                            items[itemIdx] = { ...item, title: e.target.value };
                            agenda[dayIdx] = { ...day, items };
                            setConfForm({ ...confForm, agenda });
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const agenda = [...confForm.agenda];
                            agenda[dayIdx] = {
                              ...day,
                              items: (day.items ?? []).filter((_, i) => i !== itemIdx),
                            };
                            setConfForm({ ...confForm, agenda });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const agenda = [...confForm.agenda];
                        agenda[dayIdx] = {
                          ...day,
                          items: [...(day.items ?? []), { time: "", title: "", description: "" }],
                        };
                        setConfForm({ ...confForm, agenda });
                      }}
                    >
                      Add session
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setConfForm({
                          ...confForm,
                          agenda: confForm.agenda.filter((_, i) => i !== dayIdx),
                        })
                      }
                    >
                      Remove day
                    </Button>
                  </div>
                ))}
                {!confForm.agenda.length ? (
                  <p className="text-xs text-muted-foreground">
                    No agenda days yet. Use “Build days from dates”.
                  </p>
                ) : null}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confForm.isPublished}
                  onChange={(e) => setConfForm({ ...confForm, isPublished: e.target.checked })}
                />
                Published
              </label>
              <Button type="submit" loading={loading}>
                Save conference
              </Button>
            </form>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold">Existing conferences</h3>
              <ul className="mt-3 space-y-3 text-sm">
                {(conferences.data ?? []).map((c) => (
                  <li key={c.id} className="border-t pt-3">
                    <button
                      type="button"
                      className="font-medium text-[color:var(--brand-green)]"
                      onClick={() => {
                        setConfForm({
                          slug: c.slug,
                          title: c.title,
                          theme: c.theme,
                          overview: c.overview,
                          bodyHtml: c.bodyHtml ?? "",
                          coverUrl: c.coverUrl ?? "",
                          prospectusUrl: c.prospectusUrl ?? "",
                          startsOn: fromIso(c.startsOn),
                          endsOn: fromIso(c.endsOn),
                          venue: c.venue,
                          city: c.city,
                          format: c.format,
                          isPublished: c.isPublished,
                          isFree: Boolean(c.isFree),
                          capacity: c.capacity != null ? String(c.capacity) : "",
                          agenda: (c.agenda ?? []).map((day) => ({
                            date: day.date,
                            title: day.title || "",
                            items: (day.items ?? []).map((item) => ({
                              time: item.time || "",
                              title: item.title || "",
                              description: item.description || "",
                            })),
                          })),
                          registrationOpensOn: fromIso(c.registrationOpensOn),
                          registrationClosesOn: fromIso(c.registrationClosesOn),
                          datesToBeAnnounced: Boolean(c.datesToBeAnnounced),
                          eventYear: String(new Date(c.startsOn).getFullYear()),
                        });
                        setPkgForm((p) => ({ ...p, conferenceId: c.id }));
                      }}
                    >
                      {c.title}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {c.slug} · {c.isArchived ? "Archived" : c.isPublished ? "Published" : "Draft"}{" "}
                      · {c.packages.length} packages
                    </p>
                    {!c.isArchived ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() =>
                          void apiPatch(`/admin/events/conferences/${c.id}/archive`, {
                            isArchived: true,
                          })
                            .then(() => {
                              notify.success("Conference archived.");
                              return conferences.refetch();
                            })
                            .catch((err) =>
                              notify.error(err instanceof Error ? err.message : "Archive failed."),
                            )
                        }
                      >
                        Archive
                      </Button>
                    ) : null}
                    {c._count.registrations === 0 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="ml-2 mt-2"
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Permanently delete "${c.title}" and its packages and waitlist entries?`,
                            )
                          )
                            return;
                          void apiDelete(`/admin/events/conferences/${c.id}`)
                            .then(() => {
                              notify.success("Conference deleted.");
                              return conferences.refetch();
                            })
                            .catch((err) =>
                              notify.error(err instanceof Error ? err.message : "Delete failed."),
                            );
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </li>
                ))}
                {(conferences.data ?? []).length === 0 && (
                  <p className="text-muted-foreground">No conferences yet.</p>
                )}
              </ul>
            </div>
          </div>

          <form
            className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!pkgForm.conferenceId) {
                notify.error("Select a conference first.");
                return;
              }
              setLoading(true);
              try {
                await apiPut(`/admin/events/conferences/${pkgForm.conferenceId}/packages`, {
                  name: pkgForm.name,
                  slug: pkgForm.slug || slugify(pkgForm.name),
                  description: pkgForm.description,
                  participantType: pkgForm.participantType,
                  amountNgn: Number(pkgForm.amountNgn),
                  salesOpenOn: toIso(pkgForm.salesOpenOn) ?? null,
                  salesCloseOn: toIso(pkgForm.salesCloseOn) ?? null,
                  capacity: pkgForm.capacity ? Number(pkgForm.capacity) : null,
                  isActive: pkgForm.isActive,
                  isVisible: pkgForm.isVisible,
                });
                notify.success("Package saved.");
                await conferences.refetch();
              } finally {
                setLoading(false);
              }
            }}
          >
            <h3 className="font-semibold sm:col-span-3">Conference package</h3>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={pkgForm.conferenceId}
              onChange={(e) => {
                setEditingPackageId("");
                setPkgForm(emptyPackageForm(e.target.value));
              }}
              required
            >
              <option value="">Select conference</option>
              {(conferences.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={editingPackageId}
              onChange={(e) => {
                const conference = (conferences.data ?? []).find(
                  (item) => item.id === pkgForm.conferenceId,
                );
                const selectedPackage = conference?.packages.find(
                  (item) => item.id === e.target.value,
                );
                setEditingPackageId(e.target.value);
                if (!selectedPackage) {
                  setPkgForm(emptyPackageForm(pkgForm.conferenceId));
                  return;
                }
                setPkgForm({
                  conferenceId: pkgForm.conferenceId,
                  name: selectedPackage.name,
                  slug: selectedPackage.slug,
                  participantType: selectedPackage.participantType,
                  amountNgn: String(selectedPackage.amountNgn),
                  description: selectedPackage.description,
                  salesOpenOn: fromIso(selectedPackage.salesOpenOn),
                  salesCloseOn: fromIso(selectedPackage.salesCloseOn),
                  capacity:
                    selectedPackage.capacity == null ? "" : String(selectedPackage.capacity),
                  isActive: selectedPackage.isActive,
                  isVisible: selectedPackage.isVisible ?? true,
                });
              }}
              disabled={!pkgForm.conferenceId}
            >
              <option value="">Create new package</option>
              {(conferences.data ?? [])
                .find((item) => item.id === pkgForm.conferenceId)
                ?.packages.map((item) => (
                  <option key={item.id} value={item.id}>
                    Edit: {item.name}
                  </option>
                ))}
            </select>
            <input
              className="rounded-md border px-3 py-2 text-sm"
              required
              placeholder="Package name"
              value={pkgForm.name}
              onChange={(e) =>
                setPkgForm({
                  ...pkgForm,
                  name: e.target.value,
                  slug: pkgForm.slug || slugify(e.target.value),
                })
              }
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              required
              placeholder="slug"
              disabled={Boolean(editingPackageId)}
              value={pkgForm.slug}
              onChange={(e) => setPkgForm({ ...pkgForm, slug: e.target.value })}
            />
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={pkgForm.participantType}
              onChange={(e) => setPkgForm({ ...pkgForm, participantType: e.target.value })}
            >
              {["GENERAL", "CORPORATE"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="Short description"
              value={pkgForm.description}
              onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              required
              type="number"
              min={0}
              placeholder="Amount NGN"
              value={pkgForm.amountNgn}
              onChange={(e) => setPkgForm({ ...pkgForm, amountNgn: e.target.value })}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              type="datetime-local"
              aria-label="Sales open date"
              value={pkgForm.salesOpenOn}
              onChange={(e) => setPkgForm({ ...pkgForm, salesOpenOn: e.target.value })}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              type="datetime-local"
              aria-label="Sales close date"
              value={pkgForm.salesCloseOn}
              onChange={(e) => setPkgForm({ ...pkgForm, salesCloseOn: e.target.value })}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              type="number"
              min={1}
              placeholder="Ticket capacity (optional)"
              value={pkgForm.capacity}
              onChange={(e) => setPkgForm({ ...pkgForm, capacity: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm sm:col-span-3">
              <input
                type="checkbox"
                checked={pkgForm.isActive}
                onChange={(e) => setPkgForm({ ...pkgForm, isActive: e.target.checked })}
              />
              Active for sale
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-3">
              <input
                type="checkbox"
                checked={pkgForm.isVisible}
                onChange={(e) => setPkgForm({ ...pkgForm, isVisible: e.target.checked })}
              />
              Visible publicly
            </label>
            <Button type="submit" loading={loading}>
              Save package
            </Button>
          </form>

          <div className="grid gap-6 lg:grid-cols-2">
            <form
              className="space-y-3 rounded-2xl border border-border bg-card p-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const startsOn = toIso(semForm.startsOn);
                  const endsOn = toIso(semForm.endsOn);
                  if (!startsOn || !endsOn) throw new Error("Dates required");
                  await apiPost("/admin/events/seminars", {
                    ...semForm,
                    slug: semForm.slug || slugify(semForm.title),
                    startsOn,
                    endsOn,
                    durationHours: Number(semForm.durationHours),
                    capacity: Number(semForm.capacity),
                    memberPrice: Number(semForm.memberPrice),
                    nonMemberPrice: Number(semForm.nonMemberPrice),
                    corporatePrice: Number(semForm.corporatePrice),
                    cpdPoints: Number(semForm.cpdPoints),
                  });
                  notify.success("Seminar saved.");
                  await seminars.refetch();
                } catch (err) {
                  notify.error(err instanceof Error ? err.message : "Could not save seminar.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <h3 className="font-semibold">Seminar</h3>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
                placeholder="Title"
                value={semForm.title}
                onChange={(e) =>
                  setSemForm({
                    ...semForm,
                    title: e.target.value,
                    slug: semForm.slug || slugify(e.target.value),
                  })
                }
              />
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
                placeholder="slug"
                value={semForm.slug}
                onChange={(e) => setSemForm({ ...semForm, slug: e.target.value })}
              />
              <textarea
                className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Short description"
                value={semForm.description}
                onChange={(e) => setSemForm({ ...semForm, description: e.target.value })}
              />
              <RichMediaFields
                folder="ndpo/events"
                coverUrl={semForm.coverUrl}
                bodyHtml={semForm.bodyHtml}
                onCoverChange={(coverUrl) => setSemForm({ ...semForm, coverUrl })}
                onBodyChange={(bodyHtml) => setSemForm({ ...semForm, bodyHtml })}
                coverLabel="Seminar banner / cover"
                bodyLabel="Full details"
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">
                  Starts
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
                    required
                    value={semForm.startsOn}
                    onChange={(e) => setSemForm({ ...semForm, startsOn: e.target.value })}
                  />
                </label>
                <label className="text-xs">
                  Ends
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
                    required
                    value={semForm.endsOn}
                    onChange={(e) => setSemForm({ ...semForm, endsOn: e.target.value })}
                  />
                </label>
              </div>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
                placeholder="Venue"
                value={semForm.venue}
                onChange={(e) => setSemForm({ ...semForm, venue: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="rounded-md border px-2 py-2 text-sm"
                  type="number"
                  placeholder="Hours"
                  value={semForm.durationHours}
                  onChange={(e) => setSemForm({ ...semForm, durationHours: e.target.value })}
                />
                <input
                  className="rounded-md border px-2 py-2 text-sm"
                  type="number"
                  placeholder="Capacity"
                  value={semForm.capacity}
                  onChange={(e) => setSemForm({ ...semForm, capacity: e.target.value })}
                />
                <input
                  className="rounded-md border px-2 py-2 text-sm"
                  type="number"
                  placeholder="CPD pts"
                  value={semForm.cpdPoints}
                  onChange={(e) => setSemForm({ ...semForm, cpdPoints: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="rounded-md border px-2 py-2 text-sm"
                  type="number"
                  placeholder="Member ₦"
                  value={semForm.memberPrice}
                  onChange={(e) => setSemForm({ ...semForm, memberPrice: e.target.value })}
                />
                <input
                  className="rounded-md border px-2 py-2 text-sm"
                  type="number"
                  placeholder="Non-member ₦"
                  value={semForm.nonMemberPrice}
                  onChange={(e) => setSemForm({ ...semForm, nonMemberPrice: e.target.value })}
                />
                <input
                  className="rounded-md border px-2 py-2 text-sm"
                  type="number"
                  placeholder="Corporate ₦"
                  value={semForm.corporatePrice}
                  onChange={(e) => setSemForm({ ...semForm, corporatePrice: e.target.value })}
                />
              </div>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Facilitator"
                value={semForm.facilitator}
                onChange={(e) => setSemForm({ ...semForm, facilitator: e.target.value })}
              />
              <textarea
                className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Learning outcomes"
                value={semForm.outcomes}
                onChange={(e) => setSemForm({ ...semForm, outcomes: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={semForm.certificateAvailable}
                  onChange={(e) =>
                    setSemForm({ ...semForm, certificateAvailable: e.target.checked })
                  }
                />
                Certificate available
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={semForm.isPublished}
                  onChange={(e) => setSemForm({ ...semForm, isPublished: e.target.checked })}
                />
                Published
              </label>
              <Button type="submit" loading={loading}>
                Save seminar
              </Button>
            </form>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold">Existing seminars</h3>
              <ul className="mt-3 space-y-3 text-sm">
                {(seminars.data ?? []).map((s) => (
                  <li key={s.id} className="border-t pt-3">
                    <button
                      type="button"
                      className="font-medium text-[color:var(--brand-green)]"
                      onClick={() => {
                        setSemForm({
                          slug: s.slug,
                          title: s.title,
                          description: s.description,
                          bodyHtml: s.bodyHtml ?? "",
                          coverUrl: s.coverUrl ?? "",
                          startsOn: fromIso(s.startsOn),
                          endsOn: fromIso(s.endsOn),
                          durationHours: String(s.durationHours),
                          venue: s.venue,
                          capacity: String(s.capacity),
                          audience: s.audience,
                          facilitator: s.facilitator ?? "",
                          outcomes: s.outcomes ?? "",
                          certificateAvailable: Boolean(s.certificateAvailable),
                          memberPrice: String(s.memberPrice),
                          nonMemberPrice: String(s.nonMemberPrice),
                          corporatePrice: String(s.corporatePrice),
                          paymentRequired: s.paymentRequired,
                          cpdPoints: String(s.cpdPoints),
                          isPublished: s.isPublished,
                          isCorporateEvent: s.isCorporateEvent,
                        });
                        setMaterialForm((m) => ({ ...m, seminarId: s.id }));
                      }}
                    >
                      {s.title}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {s.slug} · {s.isPublished ? "Published" : "Draft"} · CPD {s.cpdPoints} ·{" "}
                      {s.materials?.length ?? 0} materials
                    </p>
                  </li>
                ))}
                {(seminars.data ?? []).length === 0 && (
                  <p className="text-muted-foreground">No seminars yet.</p>
                )}
              </ul>
            </div>
          </div>

          <form
            className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!materialForm.seminarId) {
                notify.error("Select a seminar first (click one in the list).");
                return;
              }
              setLoading(true);
              try {
                await apiPost(`/admin/events/seminars/${materialForm.seminarId}/materials`, {
                  title: materialForm.title,
                  url: materialForm.url,
                });
                notify.success("Material added.");
                setMaterialForm({ seminarId: materialForm.seminarId, title: "", url: "" });
                await seminars.refetch();
              } finally {
                setLoading(false);
              }
            }}
          >
            <h3 className="font-semibold sm:col-span-4">Training material</h3>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              required
              value={materialForm.seminarId}
              onChange={(e) => setMaterialForm({ ...materialForm, seminarId: e.target.value })}
            >
              <option value="">Select seminar</option>
              {(seminars.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border px-3 py-2 text-sm"
              required
              placeholder="Material title"
              value={materialForm.title}
              onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              required
              type="url"
              placeholder="https://…"
              value={materialForm.url}
              onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
            />
            <Button type="submit" loading={loading}>
              Add material
            </Button>
          </form>
        </div>
      )}

      {tab === "regs" && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-border bg-card p-6">
            <h3 className="font-bold">Conference registrations</h3>
            <table className="mt-3 w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Registration ID</th>
                  <th className="p-2">Event</th>
                  <th className="p-2">Package</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2">Attendance</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {(confRegs.data ?? []).map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-2 font-medium">
                      {r.name}
                      {r.organisation ? (
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {r.organisation}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-2">
                      {r.email || "—"}
                      {r.phone ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {r.phone}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-2 font-mono text-xs">{r.registrationNumber}</td>
                    <td className="p-2">{r.conference.title}</td>
                    <td className="p-2">{r.packageName ?? r.participantType}</td>
                    <td className="p-2">
                      {Number(r.amountNgn) === 0 ? "Free" : formatNaira(Number(r.amountNgn))}
                    </td>
                    <td className="p-2">
                      <span className="font-medium">{r.paymentStatus}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{r.status}</span>
                    </td>
                    <td className="p-2">{r.attendanceStatus ?? "REGISTERED"}</td>
                    <td className="p-2">
                      {canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void apiPost(
                              `/admin/events/conferences/registrations/${r.id}/attendance`,
                              {
                                attendanceStatus: "ATTENDED",
                              },
                            ).then(() => {
                              notify.success("Conference attendance marked.");
                              void confRegs.refetch();
                            })
                          }
                        >
                          Mark attended
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(confRegs.data ?? []).length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">No conference registrations.</p>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card p-6">
            <h3 className="font-bold">Seminar registrations</h3>
            <table className="mt-3 w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Registration ID</th>
                  <th className="p-2">Event</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2">Attendance</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {(regs.data ?? []).map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-2 font-medium">
                      {r.name}
                      {r.organisation ? (
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {r.organisation}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-2">
                      {r.email || "—"}
                      {r.phone ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {r.phone}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-2 font-mono text-xs">{r.registrationNumber}</td>
                    <td className="p-2">{r.seminar.title}</td>
                    <td className="p-2">{r.participantType}</td>
                    <td className="p-2">
                      {Number(r.amountNgn) === 0 ? "Free" : formatNaira(Number(r.amountNgn))}
                    </td>
                    <td className="p-2">{r.paymentStatus}</td>
                    <td className="p-2">{r.attendanceStatus}</td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void apiPost(`/admin/events/seminars/registrations/${r.id}/attendance`, {
                            attendanceStatus: "ATTENDED",
                          }).then(() => {
                            notify.success("Attendance marked. CPD awarded if configured.");
                            void regs.refetch();
                          })
                        }
                      >
                        Mark attended
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(regs.data ?? []).length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">No seminar registrations.</p>
            )}
            {hasPermission("fees.override") && (
              <form
                className="mt-4 grid gap-2 sm:grid-cols-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  try {
                    await apiPost(`/admin/events/seminars/registrations/${override.id}/override`, {
                      amountNgn: Number(override.amountNgn),
                      reason: override.reason,
                    });
                    notify.success("Price overridden.");
                    await regs.refetch();
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <input
                  className="rounded-md border px-2 py-2 text-sm"
                  placeholder="Registration id"
                  value={override.id}
                  onChange={(e) => setOverride({ ...override, id: e.target.value })}
                />
                <input
                  className="rounded-md border px-2 py-2 text-sm"
                  placeholder="Amount"
                  value={override.amountNgn}
                  onChange={(e) => setOverride({ ...override, amountNgn: e.target.value })}
                />
                <input
                  className="rounded-md border px-2 py-2 text-sm"
                  placeholder="Reason"
                  value={override.reason}
                  onChange={(e) => setOverride({ ...override, reason: e.target.value })}
                />
                <Button type="submit" loading={loading}>
                  Override price
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
