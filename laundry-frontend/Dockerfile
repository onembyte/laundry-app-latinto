# --- base with pnpm ---
FROM node:20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# --- deps (cache via lockfile) ---
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch

# --- build ---
FROM base AS build
WORKDIR /app
COPY --from=deps /pnpm /pnpm
COPY --from=deps /app/node_modules /app/node_modules 2>/dev/null || true
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

# --- run (standalone) ---
FROM node:20 AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
# Next standalone output
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next/static ./.next/static
CMD ["node", "server.js"]
