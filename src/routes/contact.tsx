import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Mail, MapPin, Clock, Phone } from "lucide-react";
import { apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | Data Protection Officers Conference" },
      {
        name: "description",
        content:
          "Contact the Data Protection Officers Conference Secretariat for event, sponsorship, partnership and general enquiries.",
      },
      { property: "og:title", content: "Contact Data Protection Officers Conference" },
      {
        property: "og:description",
        content: "Reach the Data Protection Officers Conference Secretariat.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organisation: "",
    category: "Conference",
    subject: "",
    message: "",
    consent: false,
    website: "",
  });

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Contact"
        eyebrow="Contact Data Protection Officers Conference"
        title="Contact Data Protection Officers Conference"
        subtitle="We welcome enquiries from professionals, organisations, partners, sponsors, speakers, researchers and members of the public."
      />

      <section className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <InfoCard icon={Mail} title="Email" body="info@dpoconference.com" />
          <a
            href="tel:+2348033336644"
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-green)]"
          >
            <InfoCard icon={Phone} title="Telephone" body="+234 803 333 6644" />
          </a>
          <InfoCard icon={MapPin} title="Secretariat" body="Abuja, Nigeria" />
          <InfoCard icon={Clock} title="Operating hours" body="Mon–Fri, 9am–5pm WAT" />
        </div>
        <form
          className="p-8 rounded-2xl border border-[color:var(--border)] bg-white "
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.consent) {
              notify.error("Please consent so we can reply to your enquiry.");
              return;
            }
            setLoading(true);
            try {
              await apiPost("/public/contact", {
                name: form.name,
                email: form.email,
                phone: form.phone || undefined,
                organisation: form.organisation || undefined,
                category: form.category,
                subject: form.subject,
                message: form.message,
                consent: true,
                website: form.website,
              });
              notify.success("Message sent. We will reply to your email.");
              setForm({
                name: "",
                email: "",
                phone: "",
                organisation: "",
                category: "Conference",
                subject: "",
                message: "",
                consent: false,
                website: "",
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">
            Send us a message
          </h2>
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <Field
              label="Full name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              required
            />
            <Field
              label="Telephone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
            <Field
              label="Organisation"
              value={form.organisation}
              onChange={(v) => setForm({ ...form, organisation: v })}
            />
          </div>
          <div className="mt-4">
            <label className="text-sm font-semibold text-[color:var(--foreground)]">
              Enquiry category
            </label>
            <select
              className="mt-1 w-full rounded-md border border-[color:var(--border)] px-3 py-2.5 text-base md:text-sm bg-white"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option>Conference</option>
              <option>Sponsorship</option>
              <option>Partnership</option>
              <option>Media</option>
              <option>Technical support</option>
              <option>General enquiry</option>
            </select>
          </div>
          <Field
            className="mt-4"
            label="Subject"
            value={form.subject}
            onChange={(v) => setForm({ ...form, subject: v })}
            required
          />
          <div className="mt-4">
            <label className="text-sm font-semibold">Message</label>
            <textarea
              required
              minLength={10}
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1 w-full rounded-md border border-[color:var(--border)] px-3 py-2.5 text-base md:text-sm"
            />
          </div>
          <label className="mt-4 flex items-start gap-2 text-xs text-[color:var(--muted-foreground)]">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
            />
            By submitting this form, you acknowledge that the information provided will be processed
            for the purpose of responding to your enquiry in accordance with the Data Protection
            Officers Conference Privacy Notice.
          </label>
          <Button
            type="submit"
            loading={loading}
            className="mt-6 w-full min-h-11 rounded-md gradient-brand text-white font-bold px-4 py-3 text-sm"
          >
            Send message
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}

function InfoCard({ icon: Icon, title, body }: { icon: typeof Mail; title: string; body: string }) {
  return (
    <div className="p-5 rounded-xl border border-[color:var(--border)] bg-white flex gap-4">
      <div className="h-10 w-10 rounded-lg gradient-brand grid place-items-center text-white shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase text-[color:var(--muted-foreground)] tracking-wider">
          {title}
        </p>
        <p className="font-bold text-[color:var(--brand-deep)] mt-0.5">{body}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  type = "text",
  className = "",
  value,
  onChange,
  required,
}: {
  label: string;
  type?: string;
  className?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-semibold text-[color:var(--foreground)]">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-[color:var(--border)] px-3 py-2.5 text-base md:text-sm focus:outline-none focus:border-[color:var(--brand-emerald)]"
      />
    </div>
  );
}
