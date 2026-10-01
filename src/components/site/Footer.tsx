import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail } from "lucide-react";
import logo from "@/assets/logo.png";
import { apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";

const linkedin = import.meta.env.VITE_SOCIAL_LINKEDIN as string | undefined;
const youtube = import.meta.env.VITE_SOCIAL_YOUTUBE as string | undefined;
const twitter = import.meta.env.VITE_SOCIAL_TWITTER as string | undefined;

export function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <footer className="bg-[color:var(--brand-deep)] text-white/85 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="DPO Conference" className="h-16 w-16  bg-white rounded-md p-1" />
            <div>
              <div className="text-white font-bold text-lg">DPO Conference</div>
              <div className="text-xs tracking-widest uppercase text-[color:var(--brand-gold)]">Connect · Collaborate · Change</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed opacity-80 max-w-sm">
            DPO Conference is a professional platform supporting the competence, leadership and continuous development of Data Protection Officers and privacy professionals.
          </p>
          {(linkedin || youtube || twitter) && (
            <div className="mt-4 flex gap-3 text-sm">
              {linkedin && (
                <a href={linkedin} target="_blank" rel="noreferrer" className="hover:text-[color:var(--brand-gold)]">
                  LinkedIn
                </a>
              )}
              {youtube && (
                <a href={youtube} target="_blank" rel="noreferrer" className="hover:text-[color:var(--brand-gold)]">
                  YouTube
                </a>
              )}
              {twitter && (
                <a href={twitter} target="_blank" rel="noreferrer" className="hover:text-[color:var(--brand-gold)]">
                  X
                </a>
              )}
            </div>
          )}
        </div>

        <FooterCol
          title="Quick Links"
          links={[
            ["About Us", "/about"],
            ["Membership", "/membership"],
            ["Annual Conference", "/conferences"],
            ["Find e-invite", "/conference/lookup"],
            ["Training and CPD", "/training"],
            ["Sector Communities", "/communities"],
            ["Mentorship", "/mentorship"],
            ["Awards", "/awards"],
            ["Partnerships", "/partnerships"],
            ["Threat Intelligence", "/threat-intelligence"],
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            ["Resource Centre", "/resources"],
            ["Career Centre", "/careers"],
            ["Contact Us", "/contact"],
            ["FAQ", "/faq"],
            ["News", "/news"],
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            ["Privacy Notice", "/legal/privacy-notice"],
            ["Cookie Notice", "/legal/cookie-notice"],
            ["Terms of Use", "/legal/terms-of-use"],
            ["Membership Terms", "/legal/membership-terms"],
            ["Code of Ethics", "/legal/code-of-ethics"],
            ["Acceptable Use", "/legal/acceptable-use-policy"],
            ["Refund Policy", "/legal/refund-policy"],
          ]}
        />
        <div>
          <h4 className="text-white font-semibold mb-4">Newsletter</h4>
          <p className="text-sm opacity-80 mb-3">Subscribe to receive professional updates, regulatory intelligence, event information and career opportunities.</p>
          <form
            className="flex flex-col gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                await apiPost("/public/newsletter", { email, consent: true, website: "" });
                notify.success("You are subscribed.");
                setEmail("");
              } finally {
                setLoading(false);
              }
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-base md:text-sm placeholder:text-white/50 focus:outline-none focus:border-[color:var(--brand-gold)]"
            />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <label className="text-[11px] opacity-80">
              <input type="checkbox" required className="mr-2" />I consent to receive this newsletter.
            </label>
            <Button type="submit" loading={loading} className="min-h-11 rounded-md gradient-brand px-3 py-2 text-sm font-semibold text-white">
              Subscribe
            </Button>
          </form>
          <a href="mailto:info@dpoconference.com" className="mt-4 inline-flex items-center gap-2 text-sm hover:text-[color:var(--brand-gold)]">
            <Mail className="h-4 w-4" /> info@dpoconference.com
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-xs opacity-70">
          <p>© {new Date().getFullYear()} National Data Protection Officers Conference, Professional Network and Leadership Forum. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/legal/$slug" params={{ slug: "privacy-notice" }}>
              Privacy Notice
            </Link>
            <Link to="/legal/$slug" params={{ slug: "terms-of-use" }}>
              Terms of Use
            </Link>
            <Link to="/legal/$slug" params={{ slug: "cookie-notice" }}>
              Cookie Policy
            </Link>
            <Link to="/legal/$slug" params={{ slug: "code-of-ethics" }}>
              Code of Ethics
            </Link>
            <Link to="/legal/$slug" params={{ slug: "refund-policy" }}>
              Refunds
            </Link>
            <Link to="/legal/$slug" params={{ slug: "accessibility" }}>
              Accessibility
            </Link>
            <Link to="/cookie-settings">Cookie settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-white font-semibold mb-4">{title}</h4>
      <ul className="space-y-2 text-sm">
        {links.map(([label, to]) => (
          <li key={label}>
            {to.startsWith("/legal/") ? (
              <Link to="/legal/$slug" params={{ slug: to.replace("/legal/", "") }} className="hover:text-[color:var(--brand-gold)]">
                {label}
              </Link>
            ) : to.includes("#") ? (
              <a href={to} className="hover:text-[color:var(--brand-gold)]">
                {label}
              </a>
            ) : to === "/membership/apply" ? (
              <Link to="/membership/apply" search={{}} className="hover:text-[color:var(--brand-gold)]">
                {label}
              </Link>
            ) : to === "/login" ? (
              <Link to="/login" search={{}} className="hover:text-[color:var(--brand-gold)]">
                {label}
              </Link>
            ) : (
              <Link to={to as never} className="hover:text-[color:var(--brand-gold)]">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
