BIN := ./node_modules/.bin

help: ## Lists all available make tasks and some short documentation about them
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-24s\033[0m %s\n", $$1, $$2}'
.PHONY: help


## Basic repo maintenance

# Installs npm dependencies
node_modules: package.json yarn.lock
	yarn install
	@touch $@

build: ## Builds typescript files and UMD library
	yarn clean && yarn build-prep && yarn concurrently "yarn umd" "yarn pkg"
.PHONY: build

build-api: build ## Updates the api/analytics-next.api.md API review
	yarn generate-api
.PHONY: build-api

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

## Test Commands

tdd: node_modules ## Runs unit tests in watch mode
	$(BIN)/jest --watch
.PHONY: tdd

test-unit: node_modules ## Runs unit tests
	$(BIN)/jest
.PHONY: test-unit

test-coverage: node_modules ## Runs unit tests with coverage
	$(BIN)/jest --coverage --forceExit
.PHONY: test-coverage

test-qa: build-browser ## Runs all QA tests in a single command
	$(BIN)/jest --runTestsByPath qa/__tests__/*.test.ts --testPathIgnorePatterns qa/__tests__/destinations.test.ts --reporters="default" --reporters="<rootDir>/qa/lib/jest-reporter.js" ${args}
.PHONY: test-coverage

test-qa-destinations: build-browser ## Runs Destination QA tests. options. DESTINATION=amplitude DEBUG=true
	$(BIN)/jest --forceExit --runTestsByPath qa/__tests__/destinations.test.ts --reporters="default" --reporters="<rootDir>/qa/lib/jest-reporter.js" ${args}
.PHONY: test-coverage

test-integration: build-browser ## Runs all integration tests in a single command
	$(BIN)/jest --runTestsByPath e2e-tests/**/*.test.ts ${args}
.PHONY: test-coverage

test-perf: build-browser ## Runs all integration tests in a single command
	$(BIN)/jest --runTestsByPath e2e-tests/performance/*.test.ts ${args}
.PHONY: test-coverage

lint: node_modules ## Lints the source code
	$(BIN)/eslint '**/*.{js,jsx,ts,tsx}'
.PHONY: lint

ci:
	bash ./scripts/ci.sh
.PHONY: ci

actions-ci:
	bash ./scripts/actions-ci.sh
.PHONY: ci

size: ## Verify the final size of Analytics-Next
	NODE_ENV=production yarn umd > /dev/null && yarn size-limit
.PHONY: size

release: ## Releases Analytics Next to stage
	yarn np --yolo --no-publish --no-release-draft
.PHONY: release

release-manual: ## Releases Analytics Next to production
	make build-prod
	NODE_ENV=production aws-okta exec plat-write -- ./scripts/release.js
	npm publish
.PHONY: release-prod-manual

handshake:
	@echo "📡  Establishing Remote connection"
	@robo --config ~/dev/src/github.com/segmentio/robofiles/development/robo.yml prod.ssh echo "✅ Connected"
.PHONY: handshake

rebuild-sources-prod: handshake ## Rebuilds all sources that are using ajs-next
	@aws-okta exec prod-privileged -- ./scripts/ajs-sources.js
.PHONY: rebuild-sources-prod

rebuild-sources-stage: # Rebuilds all sources that are using ajs-next in stage
	@robo --config ~/dev/src/github.com/segmentio/robofiles/development/robo.yml rebuild-all-stage
.PHONY: rebuild-sources-stage

analyze: 
	NODE_ENV=production $(BIN)/webpack --profile --json > stats.json && $(BIN)/webpack-bundle-analyzer --port 4200 stats.json
.PHONY: analyze

dev: build ## Starts a dev server that is ready for development
	yarn concurrently "yarn run-example" "yarn pkg -w"
.PHONY: build

standalone-example: ## Runs a server with standalone ajs examples
	yarn concurrently "yarn webpack -w" "yarn serve"
.PHONY: standalone-example