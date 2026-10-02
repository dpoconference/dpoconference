import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { initials } from "@/lib/format";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { MobileBottomNav } from "./MobileBottomNav";
import type { NavItem } from "./nav-types";

function pathActive(pathname: string, to: string) {
  if (to === "/portal" || to === "/admin") return pathname === to || pathname === `${to}/`;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({
  title,
  subtitle,
  items,
  suite,
  searchPlaceholder,
  children,
}: {
  title: string;
  subtitle: string;
  items: NavItem[];
  suite: "portal" | "admin";
  searchPlaceholder: string;
  children?: ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = [...new Set(items.map((i) => i.group))];
  const notes = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet<{ id: string; readAt: string | null }[]>("/portal/notifications").catch(() => []),
    enabled: Boolean(user),
  });
  const unreadCount = (notes.data ?? []).filter((n) => !n.readAt).length;
  const homeTo = suite === "admin" ? "/admin" : "/portal";

  return (
    <SidebarProvider>
      <a
        href="#app-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border">
          <Link to={homeTo} className="flex items-center gap-3 px-2 py-2">
            <img src={logo} alt="Data Protection Officers Conference" className="h-8 w-8 object-contain brightness-0 invert" />
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block text-sm font-semibold text-sidebar-foreground">Data Protection Officers Conference</span>
              <span className="block text-[10px] uppercase tracking-widest text-sidebar-foreground/60">{subtitle}</span>
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {groups.map((group) => (
            <SidebarGroup key={group}>
              <SidebarGroupLabel className="text-sidebar-foreground/50">{group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items
                    .filter((i) => i.group === group)
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.to}>
                          <SidebarMenuButton asChild isActive={pathActive(pathname, item.to)} tooltip={item.label}>
                            <Link to={item.to as never}>
                              <Icon />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="space-y-1 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  suite === "portal" ? "bg-gold text-gold-foreground" : "bg-sidebar-accent text-sidebar-accent-foreground"
                }`}
              >
                {initials(user?.name ?? "ND")}
              </span>
            )}
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-medium text-sidebar-foreground">{user?.name}</span>
              <span className="block text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
                {user?.role.replaceAll("_", " ")}
              </span>
            </span>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign out"
                onClick={async () => {
                  await logout();
                  await navigate({ to: suite === "admin" ? "/admin-login" : "/login", search: {} });
                }}
              >
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex min-h-svh flex-1 flex-col bg-background">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger className="text-muted-foreground" />
          <div className="hidden items-center gap-2 rounded-full border border-input bg-muted/40 px-4 py-1.5 md:flex">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="w-72 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder={searchPlaceholder}
              aria-label="Search"
            />
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary lg:inline">
              {user?.role.replaceAll("_", " ")}
            </span>
            <ThemeToggle />
            <Link
              to={suite === "admin" ? "/admin" : "/portal/notifications"}
              className="relative rounded-full p-2 text-muted-foreground hover:bg-accent"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span
                  className={`absolute right-1 top-1 h-4 min-w-4 rounded-full px-1 text-center text-[10px] font-semibold leading-4 ${
                    suite === "admin" ? "bg-gold text-gold-foreground" : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <UserMenu goldAvatar={suite === "portal"} suite={suite} />
          </div>
        </header>
        <main id="app-main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <div className="space-y-8 sm:space-y-10">
            <p className="sr-only">{title}</p>
            {children ?? <Outlet />}
          </div>
        </main>
        <MobileBottomNav items={items} />
      </SidebarInset>
    </SidebarProvider>
  );
}
