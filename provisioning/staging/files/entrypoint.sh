#!/bin/sh

echo "=============== STARTING AGGREGATOR (STAGING) ==================="
cd app
echo "starting" >> ready.file
yarn run start
