# Buildkite

## How to update the buildkite docker agent
1. Make your changes to `Dockerfile.agent`.
2. Push the changes to ECR (will need `Ops Write` permission locally; CI uses the
   `buildkite-agent` cross-account role instead -- see `agent-login-ci` below).
```bash
$ cd .buildkite
$ make agent-login-local  # or: make agent-login-ci (inside a Buildkite job)
$ make agent
```
