"use client";

import { useLanguage, type LanguageCode, useStrings } from "@/lib/lang";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import BackButton from "@/components/backButton";

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

export default function PreferencesPage() {
  const { lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const t = useStrings();

  return (
    <main className="min-h-dvh bg-background text-foreground p-4">
      <BackButton />
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">{t.preferences}</h1>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>{t.language}</CardTitle>
            <CardDescription>{t.language_desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="block text-sm mb-2">{t.app_language}</label>
            <select
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">{t.stored_locally}</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>{t.appearance}</CardTitle>
            <CardDescription>{t.appearance_desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="block text-sm mb-2">{t.theme}</label>
            <select
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeMode)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <p className="mt-2 text-xs text-neutral-500">{t.theme_hint}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
