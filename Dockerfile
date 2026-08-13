# Recura server — self-hosted ERP (SPA + API + installer).
#
# Build and run:
#   docker build -t recura .
#   docker run -d -p 8787:8787 \
#     -v recura-data:/data \
#     -e RECURA_DATA_DIR=/data \
#     -e NODE_ENV=production \
#     recura
#
# Then open http://<host>:8787 and run the installer (/install) with your Postgres.
#
# Split SPA (Vercel/static front-end talking to this server): add
#   -e RECURA_CORS_ORIGINS="https://your-spa-origin.example"
# and build the SPA with VITE_API_URL="https://this-server".

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server/index.js"]
