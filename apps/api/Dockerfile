FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @local/shared build && pnpm --filter @local/api build

FROM node:22-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY apps/api/package.json apps/api/package.json
COPY --from=build /repo/apps/api/dist apps/api/dist
RUN pnpm install --frozen-lockfile --prod --filter @local/api...
WORKDIR /repo/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
