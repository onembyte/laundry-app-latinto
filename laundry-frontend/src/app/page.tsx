// src/app/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DayCarousel from "@/components/dailyCarousel";
import ActionGrid from "@/components/actionGrid";
import SettingsMenu from "@/components/settingsMenu";

export default function Page() {
  const router = useRouter();

  // Client-side guard (in addition to middleware) for dev and fallbacks
  useEffect(() => {
    const hasAuth = document.cookie.split(";").some((c) => c.trim().startsWith("auth="));
    if (!hasAuth) router.replace("/login");
  }, [router]);

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
