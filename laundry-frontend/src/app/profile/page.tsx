"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import BackButton from "@/components/backButton";
import { useStrings } from "@/lib/lang";

export default function ProfilePage() {
  const t = useStrings();
  return (
    <main className="min-h-dvh bg-background text-foreground p-4">
      <BackButton />
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">{t.profile}</h1>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>{t.account}</CardTitle>
            <CardDescription>{t.account_desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm">{t.name}</label>
              <Input placeholder="Your name" />
            </div>
            <div>
              <label className="mb-1 block text-sm">{t.email}</label>
              <Input type="email" placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm">{t.avatar}</label>
              <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                {t.upload_soon}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
