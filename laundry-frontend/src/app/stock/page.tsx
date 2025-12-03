"use client";

import BackButton from "@/components/backButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStrings } from "@/lib/lang";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StockRow = {
  id: number;
  description: string;
  unit_price_cents: number;
  available_quantity: number;
};

export default function StockPage() {
  const t = useStrings();
  const [items, setItems] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ description: "", price: "" });
  const [submitting, setSubmitting] = useState(false);

  const apiBase = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080").replace(/\/$/, ""),
    []
  );

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/api/product-types`);
        if (!res.ok) throw new Error(`Failed to fetch stock (${res.status})`);
        const json = await res.json();
        setItems(json.data || []);
        setError(null);
      } catch (err: any) {
        setError(err?.message || "Failed to load stock");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [apiBase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = Math.round(Number(form.price || "0") * 100);
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }
    if (Number.isNaN(cents) || cents < 0) {
      setError("Price must be zero or greater");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${apiBase}/api/product-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: form.description.trim(), unit_price_cents: cents }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create product");
      }
      const json = await res.json();
      if (json?.data) setItems((prev) => [json.data, ...prev]);
      setForm({ description: "", price: "" });
      setShowModal(false);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = (available: number) => {
    if (available < 20) return { label: "Low", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" };
    if (available < 60) return { label: "OK", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" };
    return { label: "Healthy", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" };
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <main className="min-h-dvh bg-background text-foreground p-4">
      <BackButton />
      <div className="mx-auto w-full max-w-5xl space-y-6 pt-10 sm:pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">{t.stock_title}</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowModal(true)}>
              {t.stock_add}
            </Button>
            <p className="text-sm text-muted-foreground max-w-md">{t.stock_desc}</p>
          </div>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Current levels</CardTitle>
            <CardDescription>On hand vs. reserved across core SKUs.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">ID</th>
                  <th className="py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium text-right">Price</th>
                  <th className="py-2 pr-3 font-medium text-right">Available</th>
                  <th className="py-2 pr-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-4 text-center text-muted-foreground" colSpan={5}>
                      Loading stock...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="py-4 text-center text-destructive text-sm" colSpan={5}>
                      {error}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="py-4 text-center text-muted-foreground" colSpan={5}>
                      No products yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => {
                    const status = statusLabel(row.available_quantity);
                    return (
                      <tr key={row.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 pr-3 font-mono text-xs">{row.id}</td>
                        <td className="py-3 pr-3 font-medium">{row.description}</td>
                        <td className="py-3 pr-3 text-right">{formatCurrency(row.unit_price_cents || 0)}</td>
                        <td className="py-3 pr-3 text-right font-semibold">{row.available_quantity}</td>
                        <td className="py-3 pr-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                              status.color
                            )}
                          >
                            <span className={cn("size-2 rounded-full", status.dot)} />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold">{t.stock_form_title}</h2>
              <p className="text-sm text-muted-foreground">{t.stock_form_desc}</p>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">{t.stock_form_description}</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Shirts, Pants, etc."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">{t.stock_form_price}</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="12.00"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : t.stock_form_submit}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
