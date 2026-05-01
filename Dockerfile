FROM oven/bun:1.3.11 AS builder
WORKDIR /app

# Copy package management
COPY package.json bun.lock ./
RUN bun install

# Copy source code
COPY . .

# Build the Astro Node Server
RUN ENABLE_CMS=true bun run build

FROM oven/bun:1.3.11 AS runner
WORKDIR /app

# Copy production build outputs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 1234
# Run the standalone Node server using Bun
CMD ["bun", "./dist/server/entry.mjs"]
