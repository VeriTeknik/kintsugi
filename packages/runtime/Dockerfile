# Single stage: install deps, build core, run runtime via tsx
FROM node:22-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy package manifests
COPY packages/core/package.json packages/core/tsconfig.json packages/core/
COPY packages/runtime/package.json packages/runtime/tsconfig.json packages/runtime/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/core/src/ packages/core/src/
COPY packages/runtime/src/ packages/runtime/src/

# Build core (runtime imports @kintsugi/core which resolves to dist/)
RUN cd packages/core && pnpm build

RUN mkdir -p /app/data/.kintsugi

ENV KINTSUGI_PORT=4100
ENV KINTSUGI_MANIFEST_PATH=/app/kintsugi.json
ENV KINTSUGI_STORAGE_PATH=/app/data/.kintsugi
ENV KINTSUGI_RENDER_MODE=static

EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -qO- http://localhost:4100/health || exit 1

WORKDIR /app/packages/runtime
CMD ["node", "--import", "tsx", "src/server.ts"]
