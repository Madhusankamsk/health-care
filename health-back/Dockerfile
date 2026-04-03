# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY src ./src/
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build" npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN sed -i 's/\r$//' ./scripts/docker-entrypoint.sh && chmod +x ./scripts/docker-entrypoint.sh
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
  && npm install prisma@6 tsx --no-save
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build" npx prisma generate
COPY --from=build /app/dist ./dist
EXPOSE 4000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
