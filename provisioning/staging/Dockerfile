FROM maelstromeous/applications:ps2alerts-websocket-base

USER node

COPY provisioning/staging/files/entrypoint.sh /etc/service/entrypoint.sh
COPY --chown=node:node ./app /app

## WIP WIP WIP
RUN cd app && npm install
