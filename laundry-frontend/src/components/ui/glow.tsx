"use client";

import { cn } from "@/lib/utils";

type GlowProps = {
  className?: string;
  strength?: "normal" | "strong";
  roundedClass?: string;
};

// Reusable radial backlight used behind cards/buttons.
// - Light theme: deep navy glow for contrast on sand.
// - Dark theme: warm off-white/sand glow to match palette.
export default function Glow({ className, strength = "normal", roundedClass }: GlowProps) {
  // Keep hover growth restrained so it doesn't spill into neighbors
  const hoverScale = strength === "strong" ? "group-hover:scale-[1.10]" : "group-hover:scale-[1.06]";

  return (
    <div
      aria-hidden
      className={cn(
        // tighter spread; keeps the glow just around the host edges
        "pointer-events-none absolute inset-0 md:-inset-1 z-0 blur-2xl md:blur-[36px] transition-all duration-500 ease-out",
        // blending: multiply on light; normal on dark for clear sand halo
        "mix-blend-multiply dark:mix-blend-normal",
        // Rounded radius follows the host element radius
        roundedClass ?? "rounded-[28px]",
        // Base visibility; increases slightly on hover
        "opacity-80 dark:opacity-85 group-hover:opacity-95 group-focus-within:opacity-95",
        hoverScale,
        // Two-layer radial gradients for bright core + tighter halo
        "bg-[radial-gradient(closest-side,_rgba(11,27,58,0.9)_0%,_rgba(11,27,58,0.65)_40%,_transparent_78%),_radial-gradient(closest-side,_rgba(11,27,58,0.35)_0%,_transparent_95%)]",
        "dark:bg-[radial-gradient(closest-side,_rgba(252,250,244,0.95)_0%,_rgba(252,250,244,0.8)_40%,_transparent_78%),_radial-gradient(closest-side,_rgba(252,250,244,0.55)_0%,_transparent_95%)]",
        // Very subtle shadow fallback
        "shadow-[0_0_40px_0_rgba(11,27,58,0.25)] dark:shadow-[0_0_48px_0_rgba(252,250,244,0.28)]",
        className
      )}
    />
  );
}
