FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

ARG PAXI_POPO_VERSION
ENV PAXI_POPO_VERSION ${PAXI_POPO_VERSION}

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
