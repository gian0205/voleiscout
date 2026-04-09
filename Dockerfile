FROM node:20-alpine AS build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --production
COPY server/ ./
COPY --from=build /app/client/dist ./public
RUN mkdir -p /app/data
VOLUME /app/data
EXPOSE 3000
ENV DB_PATH=/app/data/voleiscout.db
CMD ["node", "index.js"]
