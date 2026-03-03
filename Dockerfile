FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production=false

COPY . .

RUN npm run build

EXPOSE 8080

CMD [ "npm","run","dev" ]