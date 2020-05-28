FROM node:11

USER root

COPY ./files/entrypoint.sh /etc/service/entrypoint.sh

USER node

ENTRYPOINT /etc/service/entrypoint.sh