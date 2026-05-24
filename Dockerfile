# Etapa de compilação do Frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa de execução do Servidor
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# tsx está em devDependencies mas é necessário em produção para rodar TypeScript diretamente
RUN npm install -g tsx

# Copia os arquivos de build do frontend e os arquivos necessários do backend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/mockData.ts ./src/mockData.ts
COPY --from=builder /app/src/types.ts ./src/types.ts
COPY --from=builder /app/database.ts ./database.ts
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# O banco de dados padrão será inicializado automaticamente caso não exista no volume persistente
EXPOSE 3001

CMD ["tsx", "server.ts"]
