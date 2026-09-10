FROM node:20-alpine

WORKDIR /app

# Instala dependências aproveitando cache de camadas
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copia o restante dos arquivos do projeto
COPY . .

# Expõe a porta padrão do Vite (5173)
EXPOSE 5173

# Inicia o servidor Vite
CMD ["npm", "run", "dev"]
