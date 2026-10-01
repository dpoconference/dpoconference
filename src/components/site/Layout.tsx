import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle, breadcrumb }: { eyebrow?: string; title: string; subtitle?: string; breadcrumb?: string }) {
  return (
    <section className="relative overflow-hidden gradient-brand text-white">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(214,168,75,0.35), transparent 40%), radial-gradient(circle at 80% 80%, rgba(17,163,106,0.45), transparent 45%)" }} />
      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        {breadcrumb && <p className="text-xs uppercase tracking-widest text-[color:var(--brand-gold)] mb-4">{breadcrumb}</p>}
        {eyebrow && <p className="text-sm font-semibold text-[color:var(--brand-gold)] mb-3">{eyebrow}</p>}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold max-w-4xl">{title}</h1>
        {subtitle && <p className="mt-5 text-lg md:text-xl text-white/85 max-w-3xl leading-relaxed">{subtitle}</p>}
      </div>
    </section>
  );
}