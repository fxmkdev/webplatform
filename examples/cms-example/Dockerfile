# syntax=docker/dockerfile:1.7
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:24-alpine AS base

# Install latest corepack to keep pnpm activation aligned with the lockfile.
RUN npm install -g corepack@latest

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV CI=true
ARG APP_VERSION=0.0.0-unknown

RUN corepack enable pnpm

COPY --link package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY --link examples/cms-example/package.json examples/cms-example/package.json
COPY --link libs/cms-plugin/package.json libs/cms-plugin/package.json
COPY --link libs/common/package.json libs/common/package.json

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
      pnpm fetch --frozen-lockfile

COPY --link examples/cms-example examples/cms-example
COPY --link libs/cms-plugin libs/cms-plugin
COPY --link libs/common libs/common

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
      pnpm --filter cms-example --filter cms-plugin --filter common install --frozen-lockfile --offline
RUN pnpm --filter cms-example exec pnpm version "$APP_VERSION" --git-tag-version false
RUN pnpm --filter common build
RUN pnpm --filter cms-plugin build
RUN --mount=type=cache,id=next-cache,target=/app/examples/cms-example/.next/cache \
      pnpm --filter cms-example build
RUN mkdir -p examples/cms-example/public

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/examples/cms-example/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/examples/cms-example/.next/static ./examples/cms-example/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/examples/cms-example/public ./examples/cms-example/public

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD HOSTNAME="0.0.0.0" node examples/cms-example/.next/standalone/examples/cms-example/server.js
