export const LEGAL_DOCS = [
  { slug: "privacy-notice", title: "Privacy Notice", blurb: "How we collect, use and protect personal data under the NDPA." },
  { slug: "cookie-notice", title: "Cookie Notice", blurb: "Cookies and similar technologies used on this site." },
  { slug: "terms-of-use", title: "Terms of Use", blurb: "Rules for using the Data Protection Officers Conference website and portal." },
  { slug: "membership-terms", title: "Membership Terms", blurb: "Categories, fees, approval, cards and renewal." },
  { slug: "code-of-ethics", title: "Code of Ethics", blurb: "Conduct expected of members, speakers and participants." },
  { slug: "acceptable-use-policy", title: "Acceptable Use Policy", blurb: "What you must not do on the platform." },
  { slug: "refund-policy", title: "Refund Policy", blurb: "When membership and event fees can be returned." },
  { slug: "accessibility", title: "Accessibility", blurb: "How we try to make the site usable, and how to ask for help." },
] as const;

export type LegalSlug = (typeof LEGAL_DOCS)[number]["slug"];

export function legalTitle(slug: string) {
  return LEGAL_DOCS.find((d) => d.slug === slug)?.title ?? "Legal";
}

const META_LABELS = /^(effective date|version|controller|contact|organisation|applies to):/i;

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type LegalSection = { id: string; heading: string; blocks: LegalBlock[] };

export type ParsedLegal = {
  title: string;
  meta: { label: string; value: string }[];
  intro: string[];
  sections: LegalSection[];
};

function slugify(heading: string) {
  return heading
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Split markdown into title, meta, paragraphs and sections. Strips leftover ** markers. */
export function parseLegalMarkdown(md: string): ParsedLegal {
  const clean = md.replace(/\r\n/g, "\n").replace(/\*\*/g, "").trim();
  const lines = clean.split("\n");
  let title = "";
  const meta: { label: string; value: string }[] = [];
  const intro: string[] = [];
  const sections: LegalSection[] = [];
  let current: LegalSection | null = null;
  let para: string[] = [];
  let list: string[] | null = null;

  const target = () => current?.blocks ?? null;

  const flushPara = () => {
    const text = para.join(" ").trim();
    para = [];
    if (!text) return;
    const blocks = target();
    if (blocks) blocks.push({ type: "p", text });
    else intro.push(text);
  };

  const flushList = () => {
    if (!list?.length) {
      list = null;
      return;
    }
    const blocks = target();
    if (blocks) blocks.push({ type: "ul", items: list });
    else {
      for (const item of list) intro.push(item);
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushPara();
      continue;
    }
    if (line.startsWith("# ")) {
      title = line.slice(2).trim();
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      flushPara();
      const heading = line.slice(3).trim();
      current = { id: slugify(heading) || `section-${sections.length + 1}`, heading, blocks: [] };
      sections.push(current);
      continue;
    }
    if (!current && META_LABELS.test(line)) {
      const idx = line.indexOf(":");
      meta.push({ label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() });
      continue;
    }
    if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      flushPara();
      if (!list) list = [];
      list.push(line.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, ""));
      continue;
    }
    flushList();
    para.push(line);
  }
  flushList();
  flushPara();

  return { title, meta, intro, sections };
}
