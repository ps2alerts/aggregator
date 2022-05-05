FROM maelstromeous/applications:ps2alerts-aggregator-base

USER root

COPY provisioning/production/files/entrypoint.sh /etc/service/entrypoint.sh

USER node

COPY --chown=node:node . /app

RUN cd /app && yarn install && yarn run build
