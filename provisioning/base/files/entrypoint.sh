#!/bin/sh

case "$NODE_DEBUG" in
  true) COMMAND="npm run start:dev:debug" ;;
     *) COMMAND="npm run start:dev" ;;
esac

echo "=============== STARTING AGGREGATOR (DEV) [DEBUG: $NODE_DEBUG] ==================="
cd /app && $COMMAND
