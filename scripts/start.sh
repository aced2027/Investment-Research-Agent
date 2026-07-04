#!/bin/bash
# Start InvestIQ in production mode
cd "$(dirname "$0")/.."
echo "Starting InvestIQ..."
exec node node_modules/.bin/next start -p 3000