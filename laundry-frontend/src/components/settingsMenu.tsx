"use client";

import { useEffect, useRef, useState } from "react";
import { Boxes, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Glow from "@/components/ui/glow";
import { useStrings } from "@/lib/lang";
import { cn } from "@/lib/utils";

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);
  const t = useStrings();

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const items = [
    { id: "profile", label: t.profile, href: "/profile" },
    { id: "preferences", label: t.preferences, href: "/preferences" },
    { id: "help", label: t.help, href: "#" },
    { id: "signout", label: t.signout, href: "#" },
  ];

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      <div className="relative group isolate inline-block">
        <Glow roundedClass="rounded-full" />
        <Button asChild variant="outline" size="icon" className="relative z-10 rounded-full shadow-sm hover:shadow">
          <Link href="/stock" aria-label={t.stock_title}>
            <Boxes className="size-5" />
          </Link>
        </Button>
      </div>

      <div ref={popRef} className="relative group isolate inline-block">
        <Glow roundedClass="rounded-full" />
        <Button
          aria-haspopup="menu"
          aria-expanded={open}
          variant="outline"
          size="icon"
          className="relative z-10 rounded-full shadow-sm hover:shadow"
          onClick={() => setOpen((s) => !s)}
        >
          <Settings className="size-5 transition-transform group-hover:rotate-90" />
        </Button>

        <div
          role="menu"
          className={cn(
            "absolute right-0 mt-2 w-56 origin-top-right rounded-xl border bg-popover text-popover-foreground p-1 shadow-xl border-border",
            "transition-all duration-200",
            open ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"
          )}
        >
          {items.map((it) => (
            <Link
              key={it.id}
              role="menuitem"
              href={it.href}
              onClick={(e) => {
                setOpen(false);
                if (it.id === "signout") {
                  e.preventDefault();
                  // expire cookie and go to login
                  document.cookie = "auth=; Path=/; Max-Age=0; SameSite=Lax";
                  window.location.href = "/login";
                }
              }}
              className={cn(
                "group relative block w-full select-none rounded-lg px-3 py-2 text-left text-sm outline-none",
                // navy-tinted hover to match the palette in both themes
                "transition-colors",
                "hover:bg-blue-950/10 focus-visible:bg-blue-950/15",
                "dark:hover:bg-blue-500/15 dark:focus-visible:bg-blue-500/20"
              )}
            >
              <span className="font-medium">{it.label}</span>
              <span
                className={cn(
                  "pointer-events-none absolute inset-x-2 -bottom-1 h-2 rounded-md opacity-0 blur-md transition-opacity duration-300",
                  // soft blue halo underline on hover
                  "group-hover:opacity-100 bg-[radial-gradient(closest-side,theme(colors.blue.600/0.25),transparent_70%)] dark:bg-[radial-gradient(closest-side,theme(colors.blue.400/0.3),transparent_70%)]"
                )}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
