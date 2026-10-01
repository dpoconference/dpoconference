import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

export function UserMenu({
  goldAvatar = true,
  suite = "portal",
}: {
  goldAvatar?: boolean;
  suite?: "portal" | "admin";
}) {
  const { user, logout, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!user) return null;
  const name = user.name || `${user.firstName} ${user.lastName}`.trim();
  const home = suite === "admin" ? "/admin" : "/portal";
  const profile = suite === "admin" ? "/admin/profile" : "/portal/profile";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full px-1.5 py-1 hover:bg-accent"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
            goldAvatar ? "bg-gold text-gold-foreground" : "bg-primary/10 text-primary"
          }`}
        >
          {initials(name)}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium">{user.firstName}</span>
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
            {user.role.replaceAll("_", " ")}
          </span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-border bg-popover p-1 ">
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
            onClick={() => {
              setOpen(false);
              void navigate({ to: profile });
            }}
          >
            <UserRound className="h-4 w-4" />
            Profile
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
            onClick={() => {
              setOpen(false);
              void navigate({ to: home });
            }}
          >
            {suite === "admin" ? "Admin home" : "Portal home"}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
            onClick={async () => {
              setOpen(false);
              await logout();
              await navigate({ to: suite === "admin" ? "/admin-login" : "/login", search: {} });
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            onClick={async () => {
              setOpen(false);
              await logoutAll();
              await navigate({ to: suite === "admin" ? "/admin-login" : "/login", search: {} });
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out all devices
          </button>
        </div>
      )}
    </div>
  );
}
