#!/bin/sh
set -e

npx drizzle-kit push

exec node /usr/app/.output/server/index.mjs