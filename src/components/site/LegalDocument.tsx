import { Link } from "@tanstack/react-router";
import { FileText, Mail, Scale } from "lucide-react";
import { LEGAL_DOCS, parseLegalMarkdown, type LegalBlock } from "@/lib/legal";

function emailize(text: string) {
  const parts = text.split(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi);
  return parts.map((part, i) =>
    part.includes("@") && part.includes(".") ? (
      <a key={i} href={`mailto:${part}`} className="font-medium text-[color:var(--brand-green)] hover:underline">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) =>
        block.type === "p" ? (
          <p key={i} className="text-[15px] leading-7 text-[color:var(--foreground)]">
            {emailize(block.text)}
          </p>
        ) : (
          <ul key={i} className="space-y-2.5 pl-0">
            {block.items.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-7">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--brand-emerald)]" />
                <span>{emailize(item)}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

export function LegalDocument({
  slug,
  title,
  bodyMd,
  updatedAt,
}: {
  slug: string;
  title: string;
  bodyMd: string;
  updatedAt?: string;
}) {
  const parsed = parseLegalMarkdown(bodyMd);
  const displayTitle = parsed.title || title;
  const updated = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--brand-green)]">Legal library</p>
          <nav className="mt-4 space-y-1" aria-label="Legal documents">
            {LEGAL_DOCS.map((doc) => {
              const active = doc.slug === slug;
              return (
                <Link
                  key={doc.slug}
                  to="/legal/$slug"
                  params={{ slug: doc.slug }}
                  className={`block rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-[color:var(--brand-tint)] font-semibold text-[color:var(--brand-deep)]"
                      : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--brand-tint)]/50 hover:text-[color:var(--brand-deep)]"
                  }`}
                >
                  {doc.title}
                </Link>
              );
            })}
            <Link
              to="/cookie-settings"
              className="block rounded-xl px-3 py-2.5 text-sm text-[color:var(--muted-foreground)] hover:bg-[color:var(--brand-tint)]/50 hover:text-[color:var(--brand-deep)]"
            >
              Cookie settings
            </Link>
          </nav>
        </aside>

        <article className="min-w-0">
          <div className="rounded-2xl border border-[color:var(--border)] bg-white p-6  sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-green)]">
              <Scale className="h-3.5 w-3.5" />
              DPO Conference Secretariat · Abuja
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[color:var(--brand-deep)] sm:text-4xl">
              {displayTitle}
            </h2>
            {parsed.meta.length > 0 && (
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                {parsed.meta.map((item) => (
                  <div key={item.label} className="rounded-xl bg-[color:var(--brand-tint)]/50 px-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[color:var(--brand-deep)]">{emailize(item.value)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {updated && (
              <p className="mt-4 text-xs text-[color:var(--muted-foreground)]">Last updated {updated}</p>
            )}

            {parsed.intro.length > 0 && (
              <div className="mt-8 space-y-4 border-t border-[color:var(--border)] pt-8">
                {parsed.intro.map((p) => (
                  <p key={p} className="text-[15px] leading-7 text-[color:var(--foreground)]">
                    {emailize(p)}
                  </p>
                ))}
              </div>
            )}

            {parsed.sections.length > 1 && (
              <div className="mt-8 rounded-xl border border-[color:var(--border)] bg-[color:var(--brand-tint)]/30 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-green)]">On this page</p>
                <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                  {parsed.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="text-sm font-medium text-[color:var(--brand-deep)] hover:text-[color:var(--brand-green)]"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-4 divide-y divide-[color:var(--border)]">
              {parsed.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28 py-8">
                  <h3 className="text-xl font-extrabold text-[color:var(--brand-deep)]">{section.heading}</h3>
                  <div className="mt-4">
                    <Blocks blocks={section.blocks} />
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-[color:var(--brand-deep)] px-6 py-6 text-white sm:px-8">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--brand-gold)]" />
                <div>
                  <p className="font-semibold">This page is for transparency, not legal advice.</p>
                  <p className="mt-2 text-sm text-white/80">
                    If you have a question about how DPO Conference handles your information, or you wish to exercise a right
                    under the NDPA, write to the Secretariat.
                  </p>
                  <a
                    href="mailto:laura.c@example.net"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--brand-gold)] hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    laura.c@example.net
                  </a>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
