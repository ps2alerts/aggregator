#!/usr/bin/env bash
set -e

echo "🚀 Starting Aggregator E2E test suite!"
echo "⏳ Booting infrastructure..."

e2e-tests/bootstrap.sh

echo "✅ Infrastructure booted!"

./start-aggregator.sh

#e2e-tests/destroy.sh
