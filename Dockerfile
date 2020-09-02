# Our internal Node base image that's automatically kept update to date with security patches
# https://github.com/segmentio/images/blob/master/segment/node/Dockerfile.12.16
FROM 528451384384.dkr.ecr.us-west-2.amazonaws.com/segment-node:12.16

# Install packages required for compiling native bindings
RUN apk update && apk add make gcc g++ python

COPY ./ /analytics-next
WORKDIR /analytics-next

# Rebuild any native bindings that were copied over from CI
RUN npm rebuild

# Use a multi stage build so that the packages required for
# compiling native bindings aren't in the final image
FROM 528451384384.dkr.ecr.us-west-2.amazonaws.com/segment-node:12.16

# Create unprivileged user to run as
RUN addgroup -g 1001 -S unprivilegeduser && adduser -u 1001 -S -G unprivilegeduser unprivilegeduser
USER unprivilegeduser

COPY --chown=unprivilegeduser --from=0 /analytics-next /analytics-next
WORKDIR /analytics-next

# Output Node version info so we know exactly what version was used
RUN npm version

EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["scripts/run.sh"]
