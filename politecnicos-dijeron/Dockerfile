# syntax=docker/dockerfile:1
# Debe coincidir con el nombre del proyecto en angular.json (dist/<APP_NAME>/browser)
ARG APP_NAME=politecnicos-dijeron

# ── Etapa 1: build ───────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Etapa 2: runtime ─────────────────────────────────────────
FROM nginx:alpine AS runtime
ARG APP_NAME
# Puerto por defecto; sobrescribible en `docker run -e PORT=...`
ENV PORT=80
# La imagen de nginx aplica envsubst a /etc/nginx/templates/*.template al iniciar
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/${APP_NAME}/browser /usr/share/nginx/html
EXPOSE ${PORT}