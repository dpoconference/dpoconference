import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { apiGet } from "@/lib/api";
import { formatConferenceDateLabel, formatNaira } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import conferenceImg from "@/assets/conference.jpg";

export const Route = createFileRoute("/conferences")({
  head: () => ({
    meta: [
      { title: "Data Protection Officers Conference events" },
      {
        name: "description",
        content:
          "Flagship and special conferences for Data Protection Officers, regulators, researchers and organisational leaders.",
      },
    ],
  }),
  component: ConferencesCataloguePage,
});

type PublicConference = {
  slug: string;
  title: string;
  theme?: string;
  coverUrl?: string | null;
  startsOn: string;
  endsOn: string;
  city: string;
  isFree: boolean;
  fromAmountNgn: number | null;
  datesToBeAnnounced?: boolean;
};

type Filter = "upcoming" | "past" | "free" | "paid";

function ConferencesCataloguePage() {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const q = useQuery({
    queryKey: ["conferences"],
    queryFn: () => apiGet<PublicConference[]>("/public/conferences"),
  });

  const items = useMemo(() => {
    const now = Date.now();
    const rows = q.data ?? [];
    return rows.filter((c) => {
      const ends = new Date(c.endsOn).getTime();
      const starts = new Date(c.startsOn).getTime();
      const upcoming = ends >= now || starts >= now;
      if (filter === "upcoming") return upcoming;
      if (filter === "past") return !upcoming;
      if (filter === "free") return c.isFree || c.fromAmountNgn === 0;
      if (filter === "paid") return !c.isFree && c.fromAmountNgn != null && c.fromAmountNgn > 0;
      return true;
    });
  }, [q.data, filter]);

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Conferences"
        eyebrow="Events"
        title="Data Protection Officers Conference events"
        subtitle="Flagship and special conferences for Data Protection Officers, regulators, researchers and organisational leaders."
      />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["upcoming", "Upcoming"],
              ["past", "Past"],
              ["free", "Free"],
              ["paid", "Paid"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                filter === id
                  ? "gradient-brand text-white"
                  : "border border-[color:var(--border)] text-[color:var(--brand-deep)] hover:bg-[color:var(--brand-tint)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {q.isPending ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="mt-10 text-sm text-[color:var(--muted-foreground)]">No published conferences yet.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <article key={c.slug} className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white">
                <div className="aspect-video overflow-hidden bg-[color:var(--muted)]">
                  <img
                    src={c.coverUrl || conferenceImg}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-1.5 text-xs text-[color:var(--muted-foreground)]">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatConferenceDateLabel(c.startsOn, c.endsOn, c.datesToBeAnnounced)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[color:var(--muted-foreground)]">
                    <MapPin className="h-3.5 w-3.5" />
                    {c.city}
                  </p>
                  <h2 className="mt-3 text-lg font-bold text-[color:var(--brand-deep)]">{c.title}</h2>
                  {c.theme ? (
                    <p className="mt-2 line-clamp-2 text-sm text-[color:var(--muted-foreground)]">{c.theme}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-[color:var(--brand-tint)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-deep)]">
                      {c.isFree
                        ? "Free"
                        : c.fromAmountNgn == null
                          ? "Waitlist open"
                          : c.fromAmountNgn === 0
                            ? "Free"
                            : `From ${formatNaira(c.fromAmountNgn)}`}
                    </span>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to="/conferences/$slug"
                        params={{ slug: c.slug }}
                        className="text-sm font-semibold text-[color:var(--brand-green)] hover:text-[color:var(--brand-deep)]"
                      >
                        View details
                      </Link>
                      <Link
                        to="/conferences/$slug"
                        params={{ slug: c.slug }}
                        className="text-sm font-semibold text-[color:var(--brand-deep)] hover:text-[color:var(--brand-green)]"
                      >
                        {c.fromAmountNgn == null ? "Join waitlist" : "Register"}
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
