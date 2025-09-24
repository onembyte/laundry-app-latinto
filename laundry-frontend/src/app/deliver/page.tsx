"use client";

import BackButton from "@/components/backButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStrings } from "@/lib/lang";

export default function DeliverPage() {
  const t = useStrings();
  return (
    <main className="min-h-dvh bg-background text-foreground p-4">
      <BackButton />
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">{t.deliver_title}</h1>
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>{t.deliver_title}</CardTitle>
            <CardDescription>{t.deliver_desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Order ID</label>
              <Input placeholder="#1234" />
            </div>
            <div>
              <label className="block text-sm mb-1">Receiver</label>
              <Input placeholder="Name" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

