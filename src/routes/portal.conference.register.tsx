import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";

export const Route = createFileRoute("/portal/conference/register")({
  component: Page,
});

function Page() {
  const q = useQuery({
    queryKey: ["conferences"],
    queryFn: () => apiGet<{ slug: string; startsOn: string; endsOn: string }[]>("/public/conferences"),
  });

  if (q.isPending) return <Skeleton className="h-40" />;

  const list = q.data ?? [];
  if (list.length === 0) {
    return <Navigate to="/conferences" />;
  }

  const now = Date.now();
  const upcoming = list.filter((c) => new Date(c.endsOn).getTime() >= now);
  const slug = (upcoming[0] ?? list[0]).slug;
  return <Navigate to="/conferences/$slug/register" params={{ slug }} />;
}
