BIN := ./node_modules/.bin

help: ## Lists all available make tasks and some short documentation about them
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-24s\033[0m %s\n", $$1, $$2}'
.PHONY: help


## Basic repo maintenance

# Installs npm dependencies
node_modules: package.json yarn.lock
	yarn install
	@touch $@

build: node_modules ## Builds typescript files and UMD library
	yarn clean && yarn concurrently "yarn umd" "yarn cjs"
.PHONY: build

build-prod: ## Builds libraries in prod mode
	NODE_ENV=production yarn clean && yarn concurrently "NODE_ENV=production yarn umd" "NODE_ENV=production yarn cjs"
.PHONY: build

clean: ## Clean the build directory
	rm -rf dist generated
.PHONY: clean

## Test Commands

test-unit: node_modules ## Runs unit tests
	$(BIN)/jest
.PHONY: test-unit

test-coverage: node_modules ## Runs unit tests with coverage
	$(BIN)/jest --coverage --forceExit
.PHONY: test-coverage

test-integration: build-prod ## Runs all integration tests in a single command
	$(BIN)/jest --runTestsByPath e2e-tests/**/*.test.ts ${args}
.PHONY: test-coverage

lint: node_modules ## Lints the source code
	$(BIN)/eslint '**/*.{js,jsx,ts,tsx}'
.PHONY: lint

ci:
	bash ./scripts/ci.sh
.PHONY: ci

size: ## Verify the final size of Analytics-Next
	NODE_ENV=production yarn umd > /dev/null && yarn size-limit
.PHONY: size

version:
	yarn np --yolo --no-publish --no-release-draft --no-cleanup
.PHONY: version

release: version ## Releases Analytics Next to stage
	make build
	aws-okta exec plat-write -- ./scripts/release.ts
.PHONY: release

release-prod: version ## Releases Analytics Next to production
	NODE_ENV=production make build
	NODE_ENV=production aws-okta exec plat-write -- ./scripts/release.ts
.PHONY: release-prod

analyze: 
	NODE_ENV=production $(BIN)/webpack --profile --json > stats.json && $(BIN)/webpack-bundle-analyzer --port 4200 stats.json
.PHONY: analyze

dev: build ## Starts a dev server that is ready for development
	yarn concurrently "yarn run-example" "yarn cjs -w"
.PHONY: build

standalone-example: ## Runs a server with standalone ajs examples
	yarn concurrently "yarn webpack -w" "yarn serve"
.PHONY: standalone-example


## Recorders

record-clean:
	rm -rf e2e-tests/data/requests/*
.PHONY: record-clean

record-classic:
	AJS_VERSION=classic $(BIN)/ts-node e2e-tests/recorder/index.ts
.PHONY: record-classic

record-next:
	AJS_VERSION=next $(BIN)/ts-node e2e-tests/recorder/index.ts
.PHONY: record-next

record: build-prod record-clean
	yarn concurrently "make record-classic" "make record-next"
.PHONY: record