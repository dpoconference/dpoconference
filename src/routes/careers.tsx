import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { Briefcase, MapPin, Clock, ArrowRight, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Career Centre | Data Protection Officers Conference" },
      { name: "description", content: "Jobs, mentorship, career pathways and internships for privacy and data-protection professionals." },
      { property: "og:title", content: "Data Protection Officers Conference Career Centre" },
      { property: "og:description", content: "Grow your career in privacy and data governance." },
    ],
  }),
  component: CareersPage,
});

type Job = {
  id: string;
  title: string;
  organisation: string;
  location: string;
  employmentType?: string | null;
};

function CareersPage() {
  const { user } = useAuth();
  const jobs = useQuery({
    queryKey: ["jobs"],
    queryFn: () => apiGet<Job[]>("/public/jobs"),
  });
  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Careers"
        eyebrow="Career Centre"
        title="Privacy Career Centre"
        subtitle="The Privacy Career Centre connects qualified professionals with career, consultancy, internship and leadership opportunities within Nigeria and internationally."
      />

      <section className="mx-auto max-w-7xl px-6 pt-12 grid gap-8 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="font-extrabold text-[color:var(--brand-deep)]">For Professionals</h2>
          <CheckList
            className="mt-3"
            items={[
              "Search available vacancies",
              "Upload professional profiles",
              "Apply for jobs",
              "Receive job alerts",
              "Access career guidance",
              "Join leadership programmes",
              "Discover consultancy opportunities",
              "Apply for internships and fellowships",
            ]}
          />
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="font-extrabold text-[color:var(--brand-deep)]">For Employers</h2>
          <CheckList
            className="mt-3"
            items={[
              "Advertise vacancies",
              "Reach qualified privacy professionals",
              "Promote internships",
              "Identify consultants",
              "Participate in career events",
              "Access approved professional profiles, subject to member consent",
            ]}
          />
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="font-extrabold text-[color:var(--brand-deep)]">Career Categories</h2>
          <CheckList
            className="mt-3"
            items={[
              "Data Protection Officer",
              "Privacy Analyst",
              "Privacy Manager",
              "Compliance Officer",
              "Data Governance Officer",
              "Privacy Counsel",
              "Cybersecurity and Privacy Officer",
              "AI Governance Officer",
              "Privacy Consultant",
              "Risk and Compliance Manager",
            ]}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
            <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Featured opportunities</h2>
            {user ? (
              <Link to="/portal/employer/jobs" className="text-sm font-semibold text-[color:var(--brand-green)] min-h-11 inline-flex items-center">
                Post a vacancy →
              </Link>
            ) : (
              <Link to="/login" search={{ redirect: "/portal/employer/jobs" }} className="text-sm font-semibold text-[color:var(--brand-green)] min-h-11 inline-flex items-center">
                Post a vacancy →
              </Link>
            )}
          </div>
          {jobs.isPending && <Skeleton className="h-64" />}
          <div className="rounded-2xl border border-[color:var(--border)] overflow-hidden bg-white divide-y divide-[color:var(--border)]">
            {(jobs.data ?? []).map((j) => (
              <div key={j.id} className="p-6 hover:bg-[color:var(--brand-tint)]/30 transition-colors">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="h-11 w-11 rounded-lg gradient-brand grid place-items-center text-white shrink-0">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[color:var(--brand-deep)]">{j.title}</h3>
                    <p className="text-sm text-[color:var(--muted-foreground)]">{j.organisation}</p>
                    <div className="mt-2 flex gap-4 text-xs text-[color:var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {j.location}
                      </span>
                      {j.employmentType && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {j.employmentType}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/careers/$id"
                    params={{ id: j.id }}
                    className="text-sm font-semibold text-[color:var(--brand-green)] inline-flex items-center gap-1 min-h-11"
                  >
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
            {!jobs.isPending && (jobs.data ?? []).length === 0 && (
              <p className="p-8 text-sm text-[color:var(--muted-foreground)]">No published vacancies yet. Employers can submit a listing for Secretariat review.</p>
            )}
          </div>
        </div>
        <aside className="space-y-6">
          <div className="p-7 rounded-2xl gradient-brand text-white">
            <GraduationCap className="h-8 w-8 text-[color:var(--brand-gold)]" />
            <h3 className="mt-4 font-bold text-xl">Mentorship Programme</h3>
            <p className="mt-2 text-sm text-white/85">Get matched with an experienced DPO — or give back as a mentor.</p>
            <Link to="/mentorship" className="mt-5 inline-block rounded-md bg-[color:var(--brand-gold)] text-[color:var(--brand-deep)] font-bold px-4 py-2.5 text-sm min-h-11">
              Apply as Mentee
            </Link>
          </div>
          <div className="p-7 rounded-2xl border border-[color:var(--border)] bg-white">
            <h3 className="font-bold text-[color:var(--brand-deep)]">Build your profile</h3>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">Publish a verified professional profile visible to recruiters and peers.</p>
            {user ? (
              <Link
                to="/portal"
                className="mt-4 inline-block rounded-md border-2 border-[color:var(--brand-deep)] px-4 py-2.5 text-sm font-semibold text-[color:var(--brand-deep)] min-h-11"
              >
                Create profile
              </Link>
            ) : (
              <Link
                to="/register"
                search={{}}
                className="mt-4 inline-block rounded-md border-2 border-[color:var(--brand-deep)] px-4 py-2.5 text-sm font-semibold text-[color:var(--brand-deep)] min-h-11"
              >
                Create profile
              </Link>
            )}
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
