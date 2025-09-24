"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const USERNAME = "admin";
const PASSWORD = "latinto-1234%%";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, bounce to home
  useEffect(() => {
    if (typeof document !== "undefined") {
      const has = document.cookie.split(";").some((c) => c.trim().startsWith("auth="));
      if (has) router.replace("/");
    }
  }, [router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === USERNAME && pass === PASSWORD) {
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      document.cookie = `auth=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      router.replace("/");
      return;
    }
    setError("Invalid credentials");
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-background text-foreground p-4">
      <div className="w-full max-w-sm">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your credentials to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm">Username</label>
                <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" autoComplete="username" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Password</label>
                <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">Sign in</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

