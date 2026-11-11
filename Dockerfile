FROM oven/bun:1.4.4
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile && bun run build
ENV NODE_ENV=production
EXPOSE 3001
CMD ["bun", "apps/api/dist/index.js"]
