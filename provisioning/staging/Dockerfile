FROM maelstromeous/ps2alerts:aggregator-base

USER root

COPY provisioning/staging/files/entrypoint.sh /etc/service/entrypoint.sh

USER node

COPY --chown=node:node . /app

RUN cd /app && echo "starting" >> ready.file && yarn install && yarn run build
