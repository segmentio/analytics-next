# Buildkite setup

## Dockerfile.agent

Builds the base image that is used by analytics-next in CI.

```bash
$ robo-tooling.docker.login
$ make agent
```

## .pipeline

Full buildkite configuration.
