FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

ARG PAXI_POPO_VERSION
ENV PAXI_POPO_VERSION ${PAXI_POPO_VERSION}

# 4100을 사용한다는 정보
EXPOSE 4100

CMD ["npm", "run", "start:prod"]
