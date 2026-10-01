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

export function cmsSection(page: CmsPage | undefined, key: string): CmsSectionContent | undefined {
  return page?.sections.find((s) => s.key === key)?.content;
}
