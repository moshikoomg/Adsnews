# שירות הרינדור. נבנה מתיקיית השורש: docker build -f renderer/Dockerfile .
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-color-emoji fonts-noto-core libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 \
    libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY src/lib ./src/lib
COPY renderer/package*.json ./renderer/
RUN cd renderer && npm ci && npx remotion browser ensure
COPY renderer ./renderer
WORKDIR /app/renderer
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.mjs"]
