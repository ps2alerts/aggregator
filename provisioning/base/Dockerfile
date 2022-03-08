FROM node:16

USER root

COPY ./files/entrypoint.sh /etc/service/entrypoint.sh

USER node

ENTRYPOINT /etc/service/entrypoint.sh
