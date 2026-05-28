# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json frontend/
COPY server/package*.json server/

RUN npm ci

FROM deps AS build
WORKDIR /app

COPY . .

RUN npm run build
RUN npm prune --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV APP_ORIGIN=*

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/package*.json ./server/
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["npm", "start"]