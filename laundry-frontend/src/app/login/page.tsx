"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // If already authenticated, bounce to home
  useEffect(() => {
    if (typeof document !== "undefined") {
      const has = document.cookie.split(";").some((c) => c.trim().startsWith("session="));
      if (has) router.replace("/");
    }
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(`${API_BASE.replace(/\/$/, "")}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: user, password: pass }),
      });
      if (!res.ok) {
        let msg = "Request failed";
        try {
          const json = await res.json();
          if (json?.detail) msg = json.detail;
        } catch {
          const txt = await res.text();
          if (txt) msg = txt;
        }
        if (res.status === 409) msg = "Username already exists";
        throw new Error(msg);
      }
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-background text-foreground p-4">
      <div className="w-full max-w-sm">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>{isRegister ? "Create account" : "Sign in"}</CardTitle>
            <CardDescription>{isRegister ? "Choose a username and password to register." : "Enter your credentials to continue."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm">Username</label>
                <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" autoComplete="username" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Password</label>
                <Input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <PasswordHints value={pass} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-emerald-500">{success}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Working..." : isRegister ? "Register" : "Sign in"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">or</div>
              <Button type="button" variant="outline" className="w-full" onClick={() => setIsRegister((v) => !v)}>
                {isRegister ? "Back to login" : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PasswordHints({ value }: { value: string }) {
  const checks = [
    { label: "6-72 characters", ok: value.length >= 6 && value.length <= 72 },
    { label: "At least one lowercase letter", ok: /[a-z]/.test(value) },
    { label: "At least one uppercase letter", ok: /[A-Z]/.test(value) },
    { label: "At least one number", ok: /\d/.test(value) },
    { label: "At least one symbol", ok: /[^A-Za-z0-9]/.test(value) },
  ];
  return (
    <ul className="mt-2 space-y-1 text-xs">
      {checks.map((c) => (
        <li key={c.label} className={c.ok ? "text-emerald-500" : "text-muted-foreground"}>
          {c.label}
        </li>
      ))}
    </ul>
  );
}
