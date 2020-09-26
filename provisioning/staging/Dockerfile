FROM maelstromeous/applications:ps2alerts-aggregator-base

USER root

COPY provisioning/staging/files/entrypoint.sh /etc/service/entrypoint.sh

USER node

COPY --chown=node:node . /app

RUN cd /app && npm ci && npm run build && npm prune --production
