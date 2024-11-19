# Buildkite setup

## How to update the buildkite docker agent
1. Make your changes to `Dockerfile.agent`.
2. Push the changes to ecr
(will need `Ops Write` permission).
```bash
$ robo-tooling.docker.login
$ make agent
```
