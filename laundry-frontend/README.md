# Laundry Frontend

Next.js App Router app with a small set of reusable UI primitives, a language provider, and a theme provider. This doc outlines how things are organized so it’s easy to learn and extend.

## Getting Started

```bash
pnpm dev
# build
pnpm build && pnpm start
```

## Project Structure

- `src/app/*` – Routes and top‑level layout/providers
  - `page.tsx` – Home with action grid + 4‑day carousel
  - `profile/`, `preferences/`, `receive/`, `deliver/`, `edit/`, `status/` – Simple pages
- `src/components/*` – UI and feature components
  - `components/ui/*` – Primitives: `button`, `input`, `card`, `glow`
  - `components/*` – Feature components: `dailyCarousel`, `actionGrid`, etc.
- `src/lib/*` – App state and helpers
  - `lang.tsx` – Language provider, strings, and `useStrings()`
  - `theme.tsx` – Theme provider and `useTheme()` (light/dark/system)
  - `utils.ts` – `cn()` and helpers

### Key Patterns
- Providers are composed in `src/app/providers.tsx` so pages stay minimal.
- Visual effects are encapsulated via `components/ui/glow.tsx`.
- Styling uses CSS variables in `src/app/globals.css` for themes and palette.
- Language strings are centralized in `lib/lang.tsx`; use `useStrings()` in components.

## Adding a Page
1. Create `src/app/<route>/page.tsx`.
2. Wrap content with: `<main className="min-h-dvh bg-background text-foreground p-4">`.
3. Use primitives from `components/ui` and state from `lib` hooks.
