"use client";

import BackButton from "@/components/backButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStrings } from "@/lib/lang";

export default function StatusPage() {
  const t = useStrings();
  const statuses = [
    { id: "in_process", label: t.st_in_process },
    { id: "done", label: t.st_done },
    { id: "delayed", label: t.st_delayed },
    { id: "paused", label: t.st_paused },
  ];

  return (
    <main className="min-h-dvh bg-background text-foreground p-4">
      <BackButton />
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">{t.status_title}</h1>
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>{t.status_title}</CardTitle>
            <CardDescription>{t.status_desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statuses.map((s) => (
                <button
                  key={s.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                  type="button"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

