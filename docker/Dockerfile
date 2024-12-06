ARG NODE_VERSION=22.12.0

FROM node:${NODE_VERSION}-slim AS build

WORKDIR /usr/app

COPY . ./

RUN yarn install

EXPOSE 3000
ENV HOST=0.0.0.0 NODE_ENV=production

RUN mkdir -p /usr/database/
ENV DB_FILE_PATH=/usr/database/database.db

RUN yarn build
RUN chmod +x /usr/app/entrypoint.sh

CMD [ "/usr/app/entrypoint.sh" ]
