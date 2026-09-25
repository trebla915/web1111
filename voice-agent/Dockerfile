ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim

WORKDIR /app

RUN apt-get update -qq \
  && apt-get install --no-install-recommends -y ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production

USER node
CMD ["npm", "start"]