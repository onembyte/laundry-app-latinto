"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useStrings } from "@/lib/lang";
import Glow from "@/components/ui/glow";

export default function ActionGrid() {
  const t = useStrings();
  const items = [
    { id: "receive", label: t.action_receive, href: "/receive" },
    { id: "deliver", label: t.action_deliver, href: "/deliver" },
    { id: "edit", label: t.action_edit, href: "/edit" },
    { id: "status", label: t.action_status, href: "/status" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
      {items.map((it) => (
        <Link key={it.id} href={it.href} className="relative group isolate z-0 block">
          <Glow />

          <div
            className={cn(
              "relative z-10 rounded-[28px] border shadow-md transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] will-change-transform transform-gpu hover:z-20 focus-visible:z-20",
              "flex items-center justify-center",
              "h-40 sm:h-48 bg-card text-card-foreground border-border",
              "group-hover:scale-[1.08] group-hover:-translate-y-2 group-hover:shadow-[0_28px_48px_-18px_rgba(2,6,23,.45)]"
            )}
          >
            <span className="text-2xl sm:text-3xl font-semibold select-none">
              {it.label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
