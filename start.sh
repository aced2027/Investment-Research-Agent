#!/bin/bash
ulimit -n 4096 2>/dev/null
ulimit -u 4096 2>/dev/null
cd /home/z/my-project
exec node node_modules/.bin/next start -p 3000
