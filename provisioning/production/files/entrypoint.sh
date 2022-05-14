#!/bin/sh

echo "=============== STARTING AGGREGATOR (PRODUCTION) ==================="
cd app
echo "starting" >> ready.file
yarn run start
