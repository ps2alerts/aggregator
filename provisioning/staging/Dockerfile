FROM maelstromeous/applications:ps2alerts-websocket-base

USER node

COPY provisioning/staging/files/entrypoint.sh /etc/service/entrypoint.sh

# Fix for layer not exists error with docker github actions https://github.community/t/attempting-to-build-docker-image-with-copy-from-on-actions/16715
RUN true

COPY --chown=node:node ./app /app

RUN cd /app && npm install
