"use client";

import BackButton from "@/components/backButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStrings } from "@/lib/lang";

export default function EditOrderPage() {
  const t = useStrings();
  return (
    <main className="min-h-dvh bg-background text-foreground p-4">
      <BackButton />
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">{t.edit_title}</h1>
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>{t.edit_title}</CardTitle>
            <CardDescription>{t.edit_desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Order ID</label>
              <Input placeholder="#1234" />
            </div>
            <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
              Editing fields coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

