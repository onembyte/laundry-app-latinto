// src/app/page.tsx
"use client";
import { Button } from "@/components/ui/button";

export default function Page() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

  const ping = async () => {
    try {
      console.log("API_BASE =", apiBase);
      const r = await fetch(`${apiBase}/api/hello`, { cache: "no-store" });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      const j = await r.json();
      console.log("Ping OK:", j);
      alert(JSON.stringify(j, null, 2));
    } catch (err) {
      console.error("Ping failed:", err);
      alert("Ping failed – open DevTools » Console for details");
    }
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-neutral-50">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Laundry Frontend</h1>
        <Button onClick={ping}>Ping API</Button>
      </div>
    </main>
  );
}
