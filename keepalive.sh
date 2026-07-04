#!/bin/bash
while true; do
  ulimit -n 4096 2>/dev/null
  NODE_ENV=production node --max-old-space-size=768 /home/z/my-project/serve.mjs 2>&1
  echo "[$(date)] Server exited, restarting in 1s..." >> /tmp/keepalive.log
  sleep 1
done
