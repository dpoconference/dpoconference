import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { trainingTopics, cpdActivities } from "@/content/siteCopy";
import { Calendar, Award, Video, Users, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Professional Training and Continuing Professional Development | DPO Conference" },
      { name: "description", content: "Structured professional training and CPD opportunities designed to strengthen technical competence, practical implementation skills and leadership capacity." },
    ],
  }),
  component: TrainingPage,
});

type Seminar = {
  slug: string;
  title: string;
  description?: string;
  coverUrl?: string | null;
  startsOn: string;
  format?: string | null;
  cpdPoints?: number | null;
  memberPrice: number;
  nonMemberPrice: number;
  soldOut?: boolean;
};

function TrainingPage() {
  const q = useQuery({
    queryKey: ["seminars"],
    queryFn: () => apiGet<Seminar[]>("/public/seminars"),
  });

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Training & CPD"
        eyebrow="Training & CPD"
        title="Professional Training and Continuing Professional Development"
        subtitle="Privacy laws, technologies and regulatory expectations continue to evolve. Data Protection Officers must therefore engage in continuous learning to remain effective."
      />

      <section className="mx-auto max-w-4xl px-6 pt-12 text-[15px] leading-7">
        <p>
          DPO Conference provides structured professional training and CPD opportunities designed to strengthen technical competence,
          practical implementation skills and leadership capacity.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Quarterly Training Programme</h2>
          <p className="mt-3 text-sm">Members receive access to four professional training programmes annually. Training may cover:</p>
          <CheckList items={trainingTopics} className="mt-4" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">CPD Activities</h2>
          <p className="mt-3 text-sm">Members may earn CPD points through:</p>
          <CheckList items={cpdActivities} className="mt-4" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">CPD Dashboard</h2>
        <p className="mt-3 text-sm">Through the membership portal, members can:</p>
        <CheckList
          className="mt-4 max-w-xl"
          items={[
            "View earned CPD points",
            "Monitor annual requirements",
            "Upload external CPD evidence",
            "Download CPD statements",
            "View outstanding requirements",
            "Receive renewal reminders",
            "Access completed certificates",
          ]}
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { i: Calendar, t: "Quarterly workshops" },
            { i: Video, t: "Live webinars" },
            { i: Award, t: "Certifications" },
            { i: Users, t: "Corporate in-house" },
          ].map((x) => (
            <div key={x.t} className="p-6 rounded-2xl border border-[color:var(--border)] bg-white">
              <x.i className="h-7 w-7 text-[color:var(--brand-emerald)]" />
              <p className="mt-3 font-bold text-[color:var(--brand-deep)]">{x.t}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="training-calendar" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">Upcoming programmes</p>
            <h2 className="mt-3 text-3xl font-extrabold text-[color:var(--brand-deep)]">Training calendar</h2>
          </div>
          <Link to="/portal/cpd" className="text-sm font-semibold text-[color:var(--brand-green)]">
            CPD dashboard →
          </Link>
        </div>
        {q.isPending && <Skeleton className="h-48" />}
        <div className="rounded-2xl border border-[color:var(--border)] overflow-hidden bg-white divide-y divide-[color:var(--border)]">
          {(q.data ?? []).map((u) => (
            <div key={u.slug} className="grid grid-cols-1 items-center gap-4 p-6 hover:bg-[color:var(--brand-tint)]/30 md:grid-cols-[96px_1fr_auto_auto_auto]">
              <div className="h-20 w-full overflow-hidden rounded-xl bg-[color:var(--brand-tint)] md:h-16 md:w-24">
                {u.coverUrl ? <img src={u.coverUrl} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div>
                <h3 className="font-bold text-[color:var(--brand-deep)]">{u.title}</h3>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  Member: {u.memberPrice === 0 ? "Free" : formatNaira(u.memberPrice)} · Public: {formatNaira(u.nonMemberPrice)}
                </p>
              </div>
              <p className="text-sm flex items-center gap-1.5 text-[color:var(--foreground)]">
                <Calendar className="h-4 w-4 text-[color:var(--brand-green)]" />
                {new Date(u.startsOn).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <span className="text-xs font-semibold bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)] px-2.5 py-1 rounded-full">
                {u.format ?? "Training"}
                {u.cpdPoints ? ` · ${u.cpdPoints} CPD` : ""}
              </span>
              <Link
                to="/seminars/$slug/register"
                params={{ slug: u.slug }}
                className="rounded-md gradient-brand text-white px-4 py-2 text-sm font-semibold text-center min-h-11 inline-flex items-center justify-center w-full md:w-auto"
              >
                {u.soldOut ? "Waitlist" : "Enrol"}
              </Link>
            </div>
          ))}
          {!q.isPending && (q.data ?? []).length === 0 && (
            <p className="p-8 text-sm text-[color:var(--muted-foreground)]">No published seminars yet. Check back shortly.</p>
          )}
        </div>
      </section>

      <section className="bg-[color:var(--brand-deep)] text-white py-20">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-semibold text-[color:var(--brand-gold)] uppercase tracking-wider">CPD Framework</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold">Structured Continuing Professional Development.</h2>
            <p className="mt-4 text-white/80">
              Members earn CPD credits through DPO Conference training, external accredited programmes, conferences, publications, mentoring and committee service.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {["Annual credit requirement", "Evidence submission", "Automated tracking", "Certificate generation"].map((x) => (
              <div key={x} className="border border-white/15 rounded-xl p-6">
                <BookOpen className="h-6 w-6 text-[color:var(--brand-gold)]" />
                <p className="mt-3 font-bold">{x}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
