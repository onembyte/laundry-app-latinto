"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: { client_id: string; callback: (resp: GoogleCredentialResponse) => void }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

type GoogleCredentialResponse = {
  credential: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const googleRef = useRef<HTMLDivElement | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // If already authenticated, bounce to home
  useEffect(() => {
    if (typeof document !== "undefined") {
      const has = document.cookie.split(";").some((c) => c.trim().startsWith("session="));
      if (has) router.replace("/");
    }
  }, [router]);

  // Google Identity button
  useEffect(() => {
    if (!clientId || !googleRef.current) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && googleRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: GoogleCredentialResponse) => {
            try {
              setError(null);
              setBusy(true);
              const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ id_token: resp.credential }),
              });
              if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Google login failed");
              }
              router.replace("/");
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Google login failed";
              setError(msg);
            } finally {
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(googleRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [clientId, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        const msg = await res.text();
        throw new Error(msg || "Login failed");
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
                <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Working..." : isRegister ? "Register" : "Sign in"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">or</div>
              <Button type="button" variant="outline" className="w-full" onClick={() => setIsRegister((v) => !v)}>
                {isRegister ? "Back to login" : "Create account"}
              </Button>
              <div className="text-center">
                <div ref={googleRef} className="flex justify-center" />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
