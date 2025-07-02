MODE ?= dev

ifneq (,$(wildcard ./.env))
	include .env
	export
endif

.PHONY: all dev prod install gen run build

all: $(MODE)

install:
	pnpm install --frozen-lockfile

gen:
	pnpm run generate:sql

dev: install gen
	pnpm dev

build: install gen
	pnpm build

prod: build
	node .output/server/index.mjs
