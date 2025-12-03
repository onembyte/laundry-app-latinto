"use client";

import { addDays, format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import Glow from "@/components/ui/glow";
import { useStrings } from "@/lib/lang";

export default function DayCarousel({
  baseDate = new Date(),
}: { baseDate?: Date }) {
  const t = useStrings();

  // exactly 4 visible days: yesterday, today, +1, +2
  const d0 = startOfDay(baseDate);
  const days = [-1, 0, 1, 2].map((n) => addDays(d0, n));

  // Fixed 4-card layout (no scrolling), centered, with pop-out + neon glow
  return (
    <div className="w-full max-w-6xl mx-auto px-4" style={{ perspective: "1200px" }}>
      <div className="grid grid-cols-4 gap-6 sm:gap-8">
        {days.map((d, i) => {
          const isToday = i === 1; // today is the second card
          const pending: string[] = (isToday
            ? ["#2451", "#2452", "#2455"]
            : i === 0
            ? ["#2440"]
            : i === 2
            ? ["#2460", "#2461"]
            : [])
            .slice(0, 5);
          return (
            <div key={i} className="relative group isolate z-0">
              {/* neon electric navy glow on hover, behind the card */}
              <Glow strength={isToday ? "strong" : "normal"} />
              <div
                className={cn(
                  "relative z-10 rounded-[28px] border shadow-md transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] will-change-transform transform-gpu hover:z-20 focus-visible:z-20",
                  "flex items-center justify-start",
                  isToday ? "h-80" : "h-72",
                  isToday
                    ? [
                        // Light theme: navy active card
                        "bg-blue-950 text-blue-50 border-blue-900 ring-1 ring-blue-400/20 shadow-[0_18px_30px_-10px_rgba(2,6,23,.65)]",
                        // Dark theme: invert to off‑white/sand active card
                        "dark:bg-[#fcfaf4] dark:text-[#0b1b3a] dark:border-[#e7e1d5]",
                        // Softer ring/shadow for sand on dark bg
                        "dark:ring-1 dark:ring-blue-300/10 dark:shadow-[0_18px_30px_-10px_rgba(252,250,244,.25)]",
                      ].join(" ")
                    : "bg-card text-card-foreground border-border shadow-[0_14px_24px_-10px_rgba(2,6,23,.25)]",
                  isToday
                    ? "scale-[1.04] group-hover:scale-[1.12] group-hover:-translate-y-2 group-hover:shadow-[0_35px_60px_-15px_rgba(2,6,23,.7)]"
                    : "group-hover:scale-[1.08] group-hover:-translate-y-2 group-hover:shadow-[0_28px_48px_-18px_rgba(2,6,23,.45)]"
                )}
                style={{ transformOrigin: "center" }}
              >
                <div className="relative px-6 py-6 w-full h-full overflow-visible">
                  {/* Day number + month abbreviation in top-right of the number */}
                  <div className="pointer-events-none absolute left-6 top-0 -translate-y-[25%] overflow-visible">
                    <span
                      className={cn(
                        "relative inline-block select-none leading-none font-semibold align-top",
                        isToday
                          ? "text-8xl md:text-9xl filter drop-shadow-[0_0_14px_rgba(59,130,246,0.65)]"
                          : "text-7xl md:text-8xl"
                      )}
                    >
                      {format(d, "d")}
                      <span
                        className={cn(
                          // align with the top of the number, very close to the right edge
                          "absolute top-0 -right-1 md:-right-2",
                          // ~2x larger than before
                          "text-sm md:text-base uppercase tracking-wide font-semibold text-current"
                        )}
                      >
                        {format(d, "MMM")}
                      </span>
                    </span>
                  </div>

                  {/* Pending orders list */}
                  <div className="flex h-full flex-col min-h-0 pt-16 md:pt-20">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      {t.pending_orders}
                    </div>
                    <ul className="text-base space-y-2 flex-1 min-h-0 overflow-auto pr-1">
                      {pending.length === 0 ? (
                        <li className="text-muted-foreground">—</li>
                      ) : (
                        pending.map((id) => (
                          <li key={id} className="truncate">
                            {id}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
