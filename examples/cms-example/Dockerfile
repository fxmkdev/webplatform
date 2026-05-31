# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:24-alpine AS base

# Install latest corepack to keep pnpm activation aligned with the lockfile.
RUN npm install -g corepack@latest

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV CI=true

RUN corepack enable pnpm

COPY --link package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY --link examples/cms-example examples/cms-example
COPY --link libs/cms-plugin libs/cms-plugin
COPY --link libs/common libs/common

RUN pnpm --filter cms-example --filter cms-plugin --filter common install --frozen-lockfile
RUN pnpm --filter common build
RUN pnpm --filter cms-plugin build
RUN pnpm --filter cms-example build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app .

RUN mkdir -p examples/cms-example/.next/standalone/examples/cms-example/.next
RUN mv examples/cms-example/.next/static examples/cms-example/.next/standalone/examples/cms-example/.next/static
RUN if [ -d examples/cms-example/public ]; then \
      cp -r examples/cms-example/public examples/cms-example/.next/standalone/examples/cms-example/public; \
    fi
RUN chown -R nextjs:nodejs examples/cms-example/.next/standalone/examples/cms-example/.next

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD HOSTNAME="0.0.0.0" node examples/cms-example/.next/standalone/examples/cms-example/server.js
