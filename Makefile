BIN := ./node_modules/.bin

help: ## Lists all available make tasks and some short documentation about them
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-24s\033[0m %s\n", $$1, $$2}'
.PHONY: help

install: package.json yarn.lock
	yarn install
	@touch $@

build: ## Builds typescript files and UMD library
	yarn clean && yarn build-prep && yarn concurrently "yarn umd" "yarn pkg"
.PHONY: build

build-browser:
	@rm -rf dist/umd
	@yarn umd --no-stats
.PHONY: build-browser

build-prod: ## Builds libraries in prod mode
	NODE_ENV=production yarn clean && yarn build-prep && yarn concurrently "NODE_ENV=production yarn umd" "NODE_ENV=production yarn pkg" "NODE_ENV=production yarn cjs"
.PHONY: build

clean: ## Clean the build directory
	rm -rf dist generated
.PHONY: clean

size: ## Verify the final size of Analytics-Next
	NODE_ENV=production yarn umd > /dev/null && yarn size-limit
.PHONY: size

release: ## Releases Analytics Next to stage
	yarn np --branch master
.PHONY: release

analyze: 
	NODE_ENV=production $(BIN)/webpack --profile --json > stats.json && $(BIN)/webpack-bundle-analyzer --port 4200 stats.json
.PHONY: analyze

dev: build ## Starts a dev server that is ready for development
	yarn concurrently "yarn run-example" "yarn pkg -w"
.PHONY: build