#!/bin/bash
ulimit -n 4096 2>/dev/null
while true; do
  NODE_ENV=production node /home/z/my-project/node_modules/.bin/next start -p 3000 2>&1
  echo "Server died, restarting in 2s..."
  sleep 2
done
