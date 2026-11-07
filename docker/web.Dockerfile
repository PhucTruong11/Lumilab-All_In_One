FROM node:24-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/lab-engine/package.json packages/lab-engine/package.json
RUN npm ci

COPY tsconfig.base.json ./
COPY apps/web apps/web
COPY packages/contracts packages/contracts
COPY packages/lab-engine packages/lab-engine
ARG BUILD_SHA=unknown
ENV LUMILAB_BUILD_SHA=$BUILD_SHA
RUN npm run build:web

FROM nginx:stable-alpine
ARG BUILD_SHA=unknown
LABEL org.opencontainers.image.revision=$BUILD_SHA
ARG NGINX_CONF=docker/nginx.conf
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 80
