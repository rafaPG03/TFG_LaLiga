FROM node:20-bookworm-slim

ENV EXPO_NO_TELEMETRY=1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY app.json babel.config.js babel-theme-plugin.js index.js ./
COPY frontend ./frontend

EXPOSE 8081

CMD ["npx", "expo", "start", "--lan", "--port", "8081"]
