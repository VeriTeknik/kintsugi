# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /build

RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/core/package.json packages/core/tsconfig.json packages/core/
COPY packages/runtime/package.json packages/runtime/tsconfig.json packages/runtime/

RUN pnpm install --frozen-lockfile

COPY packages/core/src/ packages/core/src/
COPY packages/runtime/src/ packages/runtime/src/

RUN pnpm -r build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

COPY --from=builder /build/package.json /build/pnpm-workspace.yaml /build/pnpm-lock.yaml ./
COPY --from=builder /build/packages/core/package.json packages/core/
COPY --from=builder /build/packages/core/dist/ packages/core/dist/
COPY --from=builder /build/packages/runtime/package.json packages/runtime/
COPY --from=builder /build/packages/runtime/dist/ packages/runtime/dist/

RUN pnpm install --prod --frozen-lockfile

RUN mkdir -p /app/data/.kintsugi

ENV KINTSUGI_PORT=4100
ENV KINTSUGI_MANIFEST_PATH=/app/kintsugi.json
ENV KINTSUGI_STORAGE_PATH=/app/data/.kintsugi
ENV KINTSUGI_RENDER_MODE=static

EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -qO- http://localhost:4100/health || exit 1

CMD ["node", "packages/runtime/dist/server.js"]
