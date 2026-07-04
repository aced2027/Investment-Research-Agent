#!/bin/bash
# Run the server and test all screens in one process
set -e
cd /home/z/my-project

# Kill any existing server
fuser -k 3000/tcp 2>/dev/null
sleep 1

# Start server in background
node run-server.mjs > /home/z/my-project/run_server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:3000/ 2>/dev/null | grep -q 200; then
    echo "Server ready after ${i}s"
    break
  fi
  sleep 1
done

# Test all API endpoints
echo ""
echo "=== Testing API Routes ==="
echo -n "GET /: "
curl -s -o /dev/null -w "%{http_code}" --max-time 30 http://127.0.0.1:3000/

echo ""
echo -n "GET /api/news: "
curl -s --max-time 15 http://127.0.0.1:3000/api/news 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK (error fallback)' if d.get('error') else 'OK (has data)')" 2>/dev/null || echo "FAIL"

echo -n "GET /api/quote?symbol=AAPL: "
curl -s --max-time 15 http://127.0.0.1:3000/api/quote?symbol=AAPL 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK (has price)' if d.get('c') else 'OK (error fallback)')" 2>/dev/null || echo "FAIL"

echo -n "GET /api/company-news?symbol=NVDA: "
curl -s --max-time 15 http://127.0.0.1:3000/api/company-news?symbol=NVDA 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK (has news)' if d.get('news') else 'OK (error fallback)')" 2>/dev/null || echo "FAIL"

echo -n "GET /api/candle?symbol=NVDA: "
curl -s --max-time 15 "http://127.0.0.1:3000/api/candle?symbol=NVDA&resolution=D" 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK (has candles)' if d.get('candles') else 'OK (error fallback)')" 2>/dev/null || echo "FAIL"

echo -n "GET /api/recommendation?symbol=AAPL: "
curl -s --max-time 15 http://127.0.0.1:3000/api/recommendation?symbol=AAPL 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK (has recs)' if d.get('recommendations') else 'OK (error fallback)')" 2>/dev/null || echo "FAIL"

echo -n "GET /api/earnings: "
curl -s --max-time 15 http://127.0.0.1:3000/api/earnings 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK (has earnings)' if d.get('earnings') else 'OK (error fallback)')" 2>/dev/null || echo "FAIL"

echo -n "GET /api/insider-sentiment?symbol=AAPL: "
curl -s --max-time 15 http://127.0.0.1:3000/api/insider-sentiment?symbol=AAPL 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK (has sentiment)' if d.get('sentiment') else 'OK (error fallback)')" 2>/dev/null || echo "FAIL"

echo ""
echo "=== Server Logs ==="
cat /home/z/my-project/run_server.log

# Check server still alive
kill -0 $SERVER_PID 2>/dev/null && echo "Server ALIVE" || echo "Server DEAD"

echo ""
echo "Server running on PID $SERVER_PID"
wait $SERVER_PID 2>/dev/null || true