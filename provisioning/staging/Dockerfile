FROM maelstromeous/applications:ps2alerts-websocket-base

USER root

COPY provisioning/staging/files/entrypoint.sh /etc/service/entrypoint.sh

USER node

COPY --chown=node:node ./app /app

RUN cd /app && npm install && npm run build
