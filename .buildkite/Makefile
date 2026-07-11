ECR_REPOSITORY = 528451384384.dkr.ecr.us-west-2.amazonaws.com
IMAGE = ${ECR_REPOSITORY}/analytics-next-ci-agent:latest

agent: ## Build + push the CI agent image (run agent-login-ci or agent-login-local first)
	docker build --pull . -f Dockerfile.agent -t ${IMAGE}
	docker push ${IMAGE}
.PHONY: agent

agent-login-ci: ## Cross-account ECR login via the Buildkite instance role (CI only)
	CREDS=$$(aws sts assume-role --role-arn arn:aws:iam::528451384384:role/buildkite-agent --role-session-name analytics-next-ci-agent-push) && \
	AWS_ACCESS_KEY_ID=$$(echo "$$CREDS" | jq -r .Credentials.AccessKeyId) \
	AWS_SECRET_ACCESS_KEY=$$(echo "$$CREDS" | jq -r .Credentials.SecretAccessKey) \
	AWS_SESSION_TOKEN=$$(echo "$$CREDS" | jq -r .Credentials.SessionToken) \
	aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ${ECR_REPOSITORY}
.PHONY: agent-login-ci

agent-login-local: ## Local dev ECR login via aws-okta (unchanged from before the migration)
	aws-okta exec ops-write -- aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ${ECR_REPOSITORY}
.PHONY: agent-login-local
