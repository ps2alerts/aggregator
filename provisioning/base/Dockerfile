FROM node:22-bookworm

USER root

COPY ./files/entrypoint.sh /etc/service/entrypoint.sh

USER node

ENTRYPOINT /etc/service/entrypoint.sh
