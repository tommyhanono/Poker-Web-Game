#!/bin/bash
# Start the poker app (server + client)

NODE="/tmp/node-v22.16.0-darwin-arm64/bin/node"
NPM="/tmp/node-v22.16.0-darwin-arm64/bin/npm"

# Fallback to system node if tmp node is gone
if ! [ -f "$NODE" ]; then
  NODE=$(which node)
  NPM=$(which npm)
fi

echo "Starting poker server on port 3001..."
cd "$(dirname "$0")/server"
$NODE index.js &
SERVER_PID=$!

echo "Starting poker client on port 5173..."
cd "$(dirname "$0")/client"
PATH="$(dirname $NODE):$PATH" $NPM run dev &
CLIENT_PID=$!

echo ""
echo "  Server: http://localhost:3001"
echo "  Client: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT TERM
wait
