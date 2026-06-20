FROM node:18-slim

ARG CACHEBUST

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
ENV TERM=xterm

EXPOSE 3000

USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "index.js"]
