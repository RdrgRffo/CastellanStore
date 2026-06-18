# ============================================
# CastellanStore — Frontend Dockerfile
# ============================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar dependencias del frontend (contexto es raíz del proyecto)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copiar variables de entorno (necesarias para Vite)
COPY frontend/.env ./

# Copiar código fuente del frontend
COPY frontend/vite.config.js frontend/postcss.config.js frontend/tailwind.config.js frontend/eslint.config.js ./
COPY frontend/index.html ./
COPY frontend/public/ ./public/
COPY frontend/src/ ./src/
RUN npm run build

# ---- Stage 2: Nginx ----
FROM nginx:alpine AS production

# Copiar build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx para SPA (React Router)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:9100; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
