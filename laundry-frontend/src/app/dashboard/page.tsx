"use client";

import BackButton from "@/components/backButton";

export default function DashboardPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground p-4">
      <BackButton />
      <div className="mx-auto mt-24 flex max-w-3xl flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Dashboard</p>
        <h1 className="text-2xl font-semibold">Available soon, working...</h1>
        <p className="text-muted-foreground">We are building insights for your orders and stock. Check back shortly.</p>
      </div>
    </main>
  );
}
