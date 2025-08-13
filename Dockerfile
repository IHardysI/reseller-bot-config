FROM oven/bun:1.1.17
WORKDIR /app
COPY package.json ./package.json
RUN bun install
COPY src ./src
EXPOSE 3001
CMD ["bun", "run", "src/index.ts"]

