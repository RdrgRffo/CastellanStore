# ============================================
# CastellanStore — Backend Dockerfile
# ============================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar dependencias primero (caching)
COPY package.json package-lock.json ./
RUN npm install

# Copiar código fuente y compilar
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-alpine AS production

WORKDIR /app

# Copiar solo lo necesario desde builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Añadir type:module para ESM
RUN node -e "const p=require('./package.json');p.type='module';require('fs').writeFileSync('./package.json',JSON.stringify(p,null,2))"

# Puerto de la API
EXPOSE 9100

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9100/api/health || exit 1

CMD ["node", "dist/index.js"]
