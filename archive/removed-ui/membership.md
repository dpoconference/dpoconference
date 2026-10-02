# Archived Membership UI

These snippets preserve the membership navigation and homepage UI removed from the live frontend. The membership pages, API, and application flows remain available.

## Restore

1. In `src/components/site/Header.tsx`, restore the membership entry in `primary` to show it in desktop and mobile navigation. Restore the search suggestion in both the empty-query handler and the search button handler if those shortcuts are wanted.
2. In `src/routes/index.tsx`, restore the `MembershipTiers` call and component, then restore the saved CTA variables and links in `Hero` and the membership link in `FinalCTA` if those calls to action are wanted.

## Header

Restore this entry between About and Conference in `primary`:

```tsx
{ to: "/membership", label: "Membership" },
```

Restore this suggestion in both header search suggestion arrays:

```tsx
{ title: "Membership", href: "/membership" },
```

## Homepage Hero

Restore these variables after `ctaHref`:

```tsx
const secondaryCtaLabel = (heroCms?.secondaryCtaLabel as string) || "Become a Member";
const secondaryCtaHref = (heroCms?.secondaryCtaHref as string) || "/membership";
```

Restore these links inside the hero CTA row:

```tsx
<a href={secondaryCtaHref} className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold border-2 border-[color:var(--brand-deep)] text-[color:var(--brand-deep)] hover:bg-[color:var(--brand-tint)]">
  {secondaryCtaLabel}
</a>
<Link to="/benefits" className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold border-2 border-[color:var(--brand-green)] text-[color:var(--brand-green)] hover:bg-[color:var(--brand-tint)]">
  Explore Member Benefits
</Link>
```

## Homepage Membership Section

Restore `<MembershipTiers />` after `<CoreBenefits />` in `Home`, and restore this component before `ConferenceSpotlight`:

```tsx
function MembershipTiers() {
  const tiers = [
    { name: "Student", for: "Students & aspiring privacy professionals", featured: false },
    { name: "Associate", for: "Early-career practitioners building competence", featured: false },
    { name: "Professional", for: "Certified & practising DPOs", featured: true, badge: "Most Popular" },
    { name: "Fellow", for: "Senior privacy leaders & contributors", featured: false, gold: true },
    { name: "Corporate", for: "Organisations & team memberships", featured: false },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">Membership</p>
        <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">Choose the category that matches your journey.</h2>
        <p className="mt-4 text-[color:var(--muted-foreground)]">Five membership categories designed for every stage of a privacy career — from student to fellow.</p>
      </div>
      <div className="mt-12 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {tiers.map(t => (
          <div key={t.name} className={`relative rounded-2xl p-6 border-2 bg-white transition-all ${t.featured ? "border-[color:var(--brand-emerald)]  lg:-translate-y-3" : t.gold ? "border-[color:var(--brand-gold)]" : "border-[color:var(--border)]"}`}>
            {t.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[color:var(--brand-emerald)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{t.badge}</span>}
            {t.gold && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[color:var(--brand-gold)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Distinguished</span>}
            <h3 className="text-xl font-extrabold text-[color:var(--brand-deep)]">{t.name}</h3>
            <p className="mt-2 text-xs text-[color:var(--muted-foreground)] min-h-[48px]">{t.for}</p>
            <div className="mt-4 py-3 border-y border-[color:var(--border)]">
              <p className="text-xs text-[color:var(--muted-foreground)]">Annual fee</p>
              <p className="text-lg font-bold text-[color:var(--brand-deep)]">On application</p>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-[color:var(--foreground)]">
              {["Member directory", "Training access", "CPD credits", "Conference discount"].map(b => (
                <li key={b} className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--brand-emerald)] shrink-0 mt-0.5"/>{b}</li>
              ))}
            </ul>
            <Link
              to="/register"
              search={{ redirect: "/portal/apply", category: t.name.toLowerCase() }}
              className={`mt-5 block text-center rounded-md px-3 py-2.5 text-sm font-semibold ${t.featured ? "gradient-brand text-white" : "border border-[color:var(--brand-deep)] text-[color:var(--brand-deep)] hover:bg-[color:var(--brand-tint)]"}`}
            >
              Apply Now
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
```

## Final Call To Action

Restore this link in `FinalCTA` between the conference and contact links:

```tsx
<Link to="/membership" className="rounded-md px-6 py-3.5 text-sm font-semibold border-2 border-[color:var(--brand-deep)] text-[color:var(--brand-deep)] hover:bg-[color:var(--brand-tint)]">Become a Member</Link>
```