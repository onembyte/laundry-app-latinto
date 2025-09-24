"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LanguageProvider } from "@/lib/lang";
import { ThemeProvider } from "@/lib/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
