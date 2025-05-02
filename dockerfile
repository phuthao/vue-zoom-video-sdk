# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


# node server stage
FROM node:lts-alpine as node-server-stage
WORKDIR /app
COPY --from=build-stage /app/server.js .
COPY --from=build-stage /app/package.json .
COPY --from=build-stage /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "server.js"]

# production stage
FROM nginx:latest as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /usr/share/nginx/html/.well-known
COPY assetlinks.json /usr/share/nginx/html/.well-known/assetlinks.json
COPY apple-app-site-association /usr/share/nginx/html/apple-app-site-association

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

