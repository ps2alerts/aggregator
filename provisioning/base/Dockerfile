FROM node:14

USER root

COPY ./files/entrypoint.sh /etc/service/entrypoint.sh

USER node

ENTRYPOINT /etc/service/entrypoint.sh
