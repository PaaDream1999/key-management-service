FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
COPY package.json package-lock.json ./
RUN npm ci
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app && apk add --no-cache tini
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]