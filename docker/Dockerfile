ARG NODE_VERSION=22.12.0

FROM node:${NODE_VERSION}-slim AS build

# enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# install dependencies
COPY ./package.json /app/
COPY ./pnpm-lock.yaml /app/
RUN pnpm install --shamefully-hoist

# copy other files
COPY . ./

# build the app
RUN pnpm run build

# =======================
FROM node:${NODE_VERSION}-slim

WORKDIR /usr/app

# .output
COPY --from=build /app/.output/ /usr/app/.output/
COPY --from=build /app/entrypoint.sh /usr/app/entrypoint.sh

# add drizzle stuff just to push schema on start
COPY --from=build /app/drizzle.config.ts /usr/app/drizzle.config.ts
COPY --from=build /app/src/server/db/schema.ts /usr/app/src/server/db/schema.ts

EXPOSE 3000
ENV HOST=0.0.0.0 NODE_ENV=production
ENV DB_FILE_PATH=/usr/database/database.db
ENV BACKUP_FILE_PATH=/usr/database/backup.db

RUN npm install drizzle-kit drizzle-orm dotenv better-sqlite3

RUN mkdir -p /usr/database/
RUN chmod +x /usr/app/entrypoint.sh

CMD [ "/usr/app/entrypoint.sh" ]
