# ---- build stage ----
FROM mirror.gcr.io/library/node:20 AS build
WORKDIR /app

# Use pnpm via corepack
RUN corepack enable

# Install deps (cached)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm build

# ---- run stage ----
FROM node:20 AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Next.js standalone output
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next/static ./.next/static

CMD ["node", "server.js"]
