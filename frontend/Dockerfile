FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install
COPY frontend ./frontend
WORKDIR /app
