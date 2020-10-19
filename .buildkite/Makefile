ECR_REPOSITORY = 528451384384.dkr.ecr.us-west-2.amazonaws.com
IMAGE = ${ECR_REPOSITORY}/analytics-next-ci-agent:latest

agent:
	docker build --pull . -f Dockerfile.agent -t ${IMAGE}
	aws-okta exec ops-write -- docker push ${IMAGE}
.PHONY: agent