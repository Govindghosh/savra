FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install
COPY backend ./backend
RUN npm run prisma:generate --workspace backend
WORKDIR /app
