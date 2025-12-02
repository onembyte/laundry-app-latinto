"use client";

import BackButton from "@/components/backButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStrings } from "@/lib/lang";
import { cn } from "@/lib/utils";

type StockRow = {
  sku: string;
  label: string;
  onHand: number;
  reserved: number;
  lowMark: number;
};

export default function StockPage() {
  const t = useStrings();

  const items: StockRow[] = [
    { sku: "SHIRT", label: "Shirts", onHand: 240, reserved: 38, lowMark: 60 },
    { sku: "PANTS", label: "Pants", onHand: 180, reserved: 22, lowMark: 50 },
    { sku: "TOWEL", label: "Towels", onHand: 320, reserved: 48, lowMark: 80 },
    { sku: "BEDSHEET", label: "Bedsheets", onHand: 150, reserved: 30, lowMark: 70 },
  ];

  return (
    <main className="min-h-dvh bg-background text-foreground p-4">
      <BackButton />
      <div className="mx-auto w-full max-w-5xl space-y-6 pt-10 sm:pt-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{t.stock_title}</h1>
          <p className="text-sm text-muted-foreground">{t.stock_desc}</p>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Current levels</CardTitle>
            <CardDescription>On hand vs. reserved across core SKUs.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-sm border-collapse">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">SKU</th>
                  <th className="py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium text-right">On hand</th>
                  <th className="py-2 pr-3 font-medium text-right">Reserved</th>
                  <th className="py-2 pr-3 font-medium text-right">Available</th>
                  <th className="py-2 pr-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const available = row.onHand - row.reserved;
                  const healthy = available >= row.lowMark;
                  return (
                    <tr key={row.sku} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-3 font-mono text-xs">{row.sku}</td>
                      <td className="py-3 pr-3 font-medium">{row.label}</td>
                      <td className="py-3 pr-3 text-right">{row.onHand}</td>
                      <td className="py-3 pr-3 text-right text-muted-foreground">{row.reserved}</td>
                      <td className="py-3 pr-3 text-right font-semibold">{available}</td>
                      <td className="py-3 pr-3 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                            healthy
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          <span className={cn("size-2 rounded-full", healthy ? "bg-emerald-500" : "bg-amber-500")} />
                          {healthy ? "Healthy" : "Reorder"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
