// src/app/page.tsx
"use client";
import DayCarousel from "@/components/dailyCarousel";
import ActionGrid from "@/components/actionGrid";
import SettingsMenu from "@/components/settingsMenu";

export default function Page() {
  return (
    <main className="min-h-dvh grid place-items-center bg-background text-foreground p-4">
      <SettingsMenu />
      <div className="w-full max-w-3xl">
        <ActionGrid />
        <DayCarousel />
      </div>
    </main>
  );
}
