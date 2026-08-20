ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.16
FROM ${BUILD_FROM}

ENV LANG C.UTF-8

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

RUN chmod a+x /app/run.sh

CMD [ "/app/run.sh" ]
