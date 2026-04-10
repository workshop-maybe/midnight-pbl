FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS deps
RUN npm ci

FROM base AS build
# ANDAMIO_API_KEY is a runtime secret, but Astro validates the env
# schema during `astro build`, so it must be present at build time.
ARG ANDAMIO_API_KEY
# PUBLIC_ANDAMIO_NETWORK picks a profile from src/config/networks.ts.
# Everything network-dependent (gateway URL, course ID, access token
# policy ID) is resolved from that profile at build time.
ARG PUBLIC_ANDAMIO_NETWORK=preprod
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
