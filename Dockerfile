ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-slim AS build

# enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# install dependencies
COPY ./package.json /app/
COPY ./pnpm-lock.yaml /app/
RUN pnpm install --frozen-lockfile

# copy other files
COPY . ./
RUN pnpm run generate:sql

# build the app
RUN pnpm run build

# =======================
FROM node:${NODE_VERSION}-slim

WORKDIR /usr/app

# .output
COPY --from=build /app/.output/ /usr/app/.output/
COPY --from=build /app/dbschema.sql /usr/app/dbschema.sql
COPY --from=build /app/entrypoint.sh /usr/app/entrypoint.sh

EXPOSE 3000
ENV HOST=0.0.0.0 NODE_ENV=production
ENV DB_FILE_PATH=/usr/database/database.db
ENV BACKUP_FILE_PATH=/usr/database/backup.db

RUN npm install dotenv

RUN mkdir -p /usr/database/
RUN chmod +x /usr/app/entrypoint.sh

CMD [ "/usr/app/entrypoint.sh" ]
