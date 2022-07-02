#!/bin/sh

case "$NODE_DEBUG" in
  true) COMMAND="yarn run start:dev:debug" ;;
     *) COMMAND="yarn run start:dev" ;;
esac

echo "=============== STARTING AGGREGATOR (DEV) [DEBUG: $NODE_DEBUG] ==================="
cd app
echo "starting" >> ready.file
$COMMAND
