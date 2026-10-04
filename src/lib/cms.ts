import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export type CmsSectionContent = {
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  imageUrl?: string;
  items?: Array<{ title?: string; body?: string; label?: string }>;
  [key: string]: unknown;
};

export type CmsPage = {
  slug: string;
  title: string;
  sections: Array<{ key: string; sortOrder: number; content: CmsSectionContent }>;
};

export function useCmsPage(slug: string) {
  return useQuery({
    queryKey: ["cms-page", slug],
    queryFn: () => apiGet<CmsPage>(`/public/cms/pages/${slug}`),
    staleTime: 60_000,
    retry: false,
  });
}

function expandBrandName(value?: string) {
  return value?.replace(/\bDPO Conference\b/gi, "Data Protection Officers Conference");
}

export function cmsSection(page: CmsPage | undefined, key: string): CmsSectionContent | undefined {
  const content = page?.sections.find((s) => s.key === key)?.content;
  if (!content) return undefined;

  return {
    ...content,
    eyebrow: expandBrandName(content.eyebrow),
    headline: expandBrandName(content.headline),
    subhead: expandBrandName(content.subhead),
    bodyHtml: expandBrandName(content.bodyHtml),
    ctaLabel: expandBrandName(content.ctaLabel),
    secondaryCtaLabel: expandBrandName(content.secondaryCtaLabel),
    items: content.items?.map((item) => ({
      ...item,
      title: expandBrandName(item.title),
      body: expandBrandName(item.body),
      label: expandBrandName(item.label),
    })),
  };
}
