# Buildkite setup

## Dockerfile.agent

Builds the base image that is used by analytics-next in CI.

```bash
$ robo docker.login-privileged
$ make agent
```

## .pipeline

Full buildkite configuration.
