import { Link, useRouterState } from "@tanstack/react-router";
import { MoreHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { NavItem } from "./nav-types";

function pathActive(pathname: string, to: string) {
  if (to === "/portal" || to === "/admin") return pathname === to || pathname === `${to}/`;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function MobileBottomNav({ items }: { items: NavItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [more, setMore] = useState(false);
  const primary = items.filter((i) => i.mobile).slice(0, 4);
  const extra = items.filter((i) => !primary.includes(i));

  return (
    <>
      <div className="h-20 lg:hidden" />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-5">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = pathActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={`flex flex-col items-center gap-1 py-2.5 ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMore(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-muted-foreground"
            aria-label="More"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>
      {more && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setMore(false)}
          />
          <div className="absolute inset-x-0 bottom-0 animate-in slide-in-from-bottom duration-200 rounded-t-3xl border border-border bg-card p-4">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">More</p>
              <button type="button" aria-label="Close menu" onClick={() => setMore(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-6">
              {extra.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    onClick={() => setMore(false)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 text-center"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
