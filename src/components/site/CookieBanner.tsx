import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!localStorage.getItem("ndpo_cookies"));
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] bg-[color:var(--brand-deep)] text-white p-4">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <p className="text-sm">
          We use necessary cookies for security and login.{" "}
          <Link to="/legal/$slug" params={{ slug: "cookie-notice" }} className="underline">
            Cookie Notice
          </Link>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="text-[color:var(--brand-deep)]"
            onClick={() => {
              localStorage.setItem("ndpo_cookies", "necessary");
              setShow(false);
            }}
          >
            Reject
          </Button>
          <Button
            className="gradient-brand text-white"
            onClick={() => {
              localStorage.setItem("ndpo_cookies", "all");
              setShow(false);
            }}
          >
            Accept
          </Button>
          <Link to="/cookie-settings" className="text-sm underline self-center">
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
