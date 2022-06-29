BIN := ./node_modules/.bin
yarn_run := yarn workspace @segment/analytics-next

help: ## Lists all available make tasks and some short documentation about them
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-24s\033[0m %s\n", $$1, $$2}'
.PHONY: help


## Basic repo maintenance

# Installs npm dependencies
node_modules:
	yarn set version self
	yarn install --immutable
	@touch $@

build-browser:
	@rm -rf dist/umd
	$(yarn_run) umd --no-stats
.PHONY: build-browser

build-prod: ## Builds libraries in prod mode
	$(yarn_run) build:prod
.PHONY: build-prod

clean: ## Clean the build directory
	rm -rf dist generated
.PHONY: clean

## Test Commands

tdd: node_modules ## Runs unit tests in watch mode
	$(yarn_run) test --watch
.PHONY: tdd

test-unit: node_modules ## Runs unit tests
	$(yarn_run) test
.PHONY: test-unit

test-coverage: node_modules ## Runs unit tests with coverage
	$(yarn_run) test --coverage --forceExit
.PHONY: test-coverage

test-qa: build-browser ## Runs all QA tests in a single command
	$(yarn_run) test --runTestsByPath qa/__tests__/*.test.ts --testPathIgnorePatterns qa/__tests__/destinations.test.ts --reporters="default" --reporters="<rootDir>/qa/lib/jest-reporter.js" ${args}
.PHONY: test-coverage

test-qa-destinations: build-browser ## Runs Destination QA tests. options. DESTINATION=amplitude DEBUG=true
	$(yarn_run) test --forceExit --runTestsByPath qa/__tests__/destinations.test.ts --reporters="default" --reporters="<rootDir>/qa/lib/jest-reporter.js" ${args}
.PHONY: test-coverage

test-integration: build-prod ## Runs all integration tests in a single command
	$(yarn_run) test --forceExit --runTestsByPath e2e-tests/**/*.test.ts ${args}
.PHONY: test-coverage

test-perf: build-prod ## Runs all integration tests in a single command
	$(yarn_run) test --forceExit --runTestsByPath e2e-tests/performance/*.test.ts ${args}
.PHONY: test-coverage

lint: node_modules ## Lints the source code
	$(yarn_run) lint
.PHONY: lint

ci:
	bash ./scripts/ci.sh
.PHONY: ci

actions-ci:
	bash ./scripts/actions-ci.sh
.PHONY: ci

size: ## Verify the final size of Analytics-Next
	NODE_ENV=production $(yarn_run) umd > /dev/null && $(yarn_run) size-limit
.PHONY: size

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

dev: ## Starts a dev server that is ready for development
	$(yarn_run) concurrently "yarn workspace with-next-js dev" "$(yarn_run) pkg -w"
.PHONY: dev
