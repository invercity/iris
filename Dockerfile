FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/iris-api/package.json ./apps/iris-api/
COPY apps/iris-app/package.json ./apps/iris-app/
COPY apps/iris-admin/package.json ./apps/iris-admin/

RUN npm install

COPY . .

RUN npm run build:shared && npm run build:api && npm run build:app

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=iris-api"]
