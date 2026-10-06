import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Search, ShieldCheck, Users, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";

const primary = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/membership", label: "Membership" },
  { to: "/conferences", label: "Conference" },
  { to: "/training", label: "Training" },
  { to: "/courses", label: "Courses" },
] as const;

const more = [
  { to: "/conference/lookup", label: "Find e-invite" },
  { to: "/communities", label: "Communities" },
  { to: "/resources", label: "Resources" },
  { to: "/careers", label: "Careers" },
  { to: "/benefits", label: "Benefits" },
  { to: "/contact", label: "Contact" },
] as const;

const allNav = [...primary, ...more];

const navLink =
  "px-2.5 py-1.5 rounded-md text-sm font-medium text-[color:var(--foreground)] hover:text-[color:var(--brand-green)] hover:bg-[color:var(--brand-tint)] transition-colors";
const navActive =
  "px-2.5 py-1.5 rounded-md text-sm font-semibold text-[color:var(--brand-deep)] bg-[color:var(--brand-tint)]";

function HeaderDashboardLink({
  className = "hover:text-[color:var(--brand-gold)]",
}: {
  className?: string;
}) {
  const { user } = useAuth();
  if (!user) return null;

  const to = user.permissions.includes("admin.access") ? "/admin" : "/portal";
  return (
    <Link to={to} className={className}>
      {user.firstName} · Dashboard
    </Link>
  );
}

export function Header() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ title: string; href: string }[]>([]);
  const [conference, setConference] = useState<{ title: string; slug: string } | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet<{ title: string; slug: string }[]>("/public/conferences")
      .then((rows) => setConference(rows[0] ?? null))
      .catch(() => setConference(null));
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) {
      setHits([
        { title: "Conferences", href: "/conferences" },
        { title: "Membership", href: "/membership" },
        { title: "Training", href: "/training" },
        { title: "Resources", href: "/resources" },
        { title: "FAQ", href: "/faq" },
      ]);
      return;
    }
    const [resources, news, conferences] = await Promise.all([
      apiGet<{ title: string; slug: string }[]>("/public/resources").catch(() => []),
      apiGet<{ title: string; slug: string }[]>("/public/news").catch(() => []),
      apiGet<{ title: string; slug: string }[]>("/public/conferences").catch(() => []),
    ]);
    const needle = term.toLowerCase();
    setHits(
      [
        ...conferences
          .filter(
            (c) => c.title.toLowerCase().includes(needle) || c.slug.toLowerCase().includes(needle),
          )
          .map((c) => ({ title: c.title, href: `/conferences/${c.slug}` })),
        ...resources
          .filter((r) => r.title.toLowerCase().includes(needle))
          .map((r) => ({ title: r.title, href: "/resources" })),
        ...news
          .filter((n) => n.title.toLowerCase().includes(needle))
          .map((n) => ({ title: n.title, href: `/news/${n.slug}` })),
      ].slice(0, 8),
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="hidden lg:block bg-[color:var(--brand-deep)] text-white">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-5 text-[11px]">
          <p className="truncate opacity-80">
            Advancing privacy leadership and data governance excellence
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              to="/verify-member"
              className="inline-flex items-center gap-1 hover:text-[color:var(--brand-gold)]"
            >
              <ShieldCheck className="h-3 w-3" />
              Verify member
            </Link>
            <Link
              to="/members/directory"
              className="inline-flex items-center gap-1 hover:text-[color:var(--brand-gold)]"
            >
              <Users className="h-3 w-3" />
              Find a DPO
            </Link>
            <a
              href="mailto:info@dpoconference.com"
              className="hover:text-[color:var(--brand-gold)]"
            >
              info@dpoconference.com
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-[color:var(--border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-32 max-w-7xl items-center gap-3 px-4 sm:px-5 lg:h-44">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2">
            <img
              src={logo}
              alt="Data Protection Officers Conference"
              className="h-28 w-28 object-contain sm:h-40 sm:w-40"
            />
            <div className="leading-none">
              <div className="text-[13px] font-bold tracking-tight text-[color:var(--brand-deep)] sm:text-[15px]">
                <span>Data Protection Officers Conference</span>
              </div>
              <div className="mt-0.5 hidden text-[9px] uppercase tracking-[0.14em] text-[color:var(--brand-green)] sm:block">
                PROFESSIONAL NETWORK &amp; LEADERSHIP FORUM
              </div>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center lg:flex">
            {primary.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={navLink}
                activeProps={{ className: navActive }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                className={`${navLink} inline-flex items-center gap-0.5`}
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((v) => !v)}
              >
                More
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                />
              </button>
              {moreOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-[color:var(--border)] bg-white py-1 ">
                  {more.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      className="block px-3 py-2 text-sm hover:bg-[color:var(--brand-tint)] hover:text-[color:var(--brand-deep)]"
                      onClick={() => setMoreOpen(false)}
                    >
                      {n.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="ml-auto hidden items-center gap-1.5 md:flex">
            <button
              type="button"
              aria-label="Search"
              className="grid h-8 w-8 place-items-center rounded-md text-[color:var(--muted-foreground)] hover:bg-[color:var(--brand-tint)] hover:text-[color:var(--brand-deep)]"
              onClick={() => {
                setSearchOpen(true);
                setHits([
                  { title: "Conference", href: "/conference" },
                  { title: "Membership", href: "/membership" },
                  { title: "Training", href: "/training" },
                  { title: "News", href: "/news" },
                ]);
              }}
            >
              <Search className="h-4 w-4" />
            </button>
            {!user && (
              <>
                <Link
                  to="/login"
                  className="px-2.5 py-1.5 text-sm font-medium text-[color:var(--foreground)] hover:text-[color:var(--brand-green)]"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-md border border-[color:var(--border)] px-3 py-2 text-sm font-semibold text-[color:var(--brand-deep)] hover:bg-[color:var(--brand-tint)]"
                >
                  Create account
                </Link>
              </>
            )}
            <HeaderDashboardLink className="px-2.5 py-1.5 text-sm font-medium text-[color:var(--foreground)] hover:text-[color:var(--brand-green)]" />
            <Link
              to={conference ? "/conferences/$slug/register" : "/conferences"}
              params={conference ? { slug: conference.slug } : undefined}
              className="rounded-md px-3 py-3 text-sm font-semibold text-white gradient-brand hover:opacity-95"
            >
              {conference ? "Register for conference" : "Conferences"}
            </Link>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            className="ml-auto grid h-9 w-9 place-items-center rounded-md hover:bg-[color:var(--brand-tint)] lg:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-[color:var(--border)] bg-white lg:hidden">
            <div className="flex flex-col px-4 py-3">
              {allNav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="py-2 text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </Link>
              ))}
              <Link
                to="/verify-member"
                className="py-2 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Verify member
              </Link>
              <Link
                to="/members/directory"
                className="py-2 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Find a DPO
              </Link>
              {!user && (
                <>
                  <Link
                    to="/login"
                    className="py-2 text-sm font-medium"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="py-2 text-sm font-medium"
                    onClick={() => setOpen(false)}
                  >
                    Create account
                  </Link>
                </>
              )}
              <HeaderDashboardLink className="py-2 text-sm font-medium hover:text-[color:var(--brand-green)]" />
              <div className="mt-2">
                <Link
                  to={conference ? "/conferences/$slug/register" : "/conferences"}
                  params={conference ? { slug: conference.slug } : undefined}
                  className="block w-full rounded-md px-3 py-2 text-center text-sm font-semibold text-white gradient-brand"
                  onClick={() => setOpen(false)}
                >
                  {conference ? "Register for conference" : "Conferences"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {conference && (
        <div className="border-b border-[color:var(--brand-emerald)]/20 bg-[color:var(--brand-tint)]">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-center gap-2 px-4 text-[11px] text-[color:var(--brand-deep)] sm:text-xs">
            <span className="truncate">
              Registration is open for <strong>{conference.title}</strong>
            </span>
            <Link
              to="/conferences/$slug/register"
              params={{ slug: conference.slug }}
              className="shrink-0 font-semibold underline underline-offset-2 hover:text-[color:var(--brand-green)]"
            >
              Register
            </Link>
            <Link
              to="/conference/lookup"
              className="shrink-0 font-semibold underline underline-offset-2 hover:text-[color:var(--brand-green)]"
            >
              Find e-invite
            </Link>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-[70] bg-black/40 p-4" onClick={() => setSearchOpen(false)}>
          <form
            className="mx-auto mt-20 max-w-lg rounded-xl bg-white p-4 "
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void runSearch(e)}
          >
            <p className="text-sm font-semibold text-[color:var(--brand-deep)]">
              Search resources and news
            </p>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Search…"
            />
            <button
              type="submit"
              className="mt-2 rounded-md px-3 py-1.5 text-sm font-semibold text-white gradient-brand"
            >
              Search
            </button>
            <ul className="mt-3 space-y-1.5 text-sm">
              {hits.map((h) => (
                <li key={`${h.href}-${h.title}`}>
                  <button
                    type="button"
                    className="text-left font-medium text-[color:var(--brand-green)]"
                    onClick={() => {
                      setSearchOpen(false);
                      void navigate({ to: h.href as never });
                    }}
                  >
                    {h.title}
                  </button>
                </li>
              ))}
            </ul>
          </form>
        </div>
      )}
    </header>
  );
}
