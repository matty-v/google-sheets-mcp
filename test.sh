#!/bin/bash

BASE_URL="https://us-central1-kinetic-object-322814.cloudfunctions.net/google-sheets-mcp"
SPREADSHEET_ID="1bU4G2X2NNlg338t11Bnihau8b-FT8NINTk30ECCWNVE"
TMPFILE=$(mktemp)

echo "Connecting to SSE..."
curl -s -N "$BASE_URL/sse" > "$TMPFILE" 2>&1 &
SSE_PID=$!

sleep 3
SESSION_ID=$(grep "data:" "$TMPFILE" | head -1 | sed 's/.*sessionId=//')
echo "Session ID: $SESSION_ID"

if [ -z "$SESSION_ID" ]; then
  echo "Failed to get session ID. SSE output:"
  cat "$TMPFILE"
  kill $SSE_PID 2>/dev/null
  rm "$TMPFILE"
  exit 1
fi

echo -e "\n--- Calling list_sheets ---"
curl -s -X POST "$BASE_URL/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": { "name": "test-client", "version": "1.0.0" }
    }
  }'

sleep 2

curl -s -X POST "$BASE_URL/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 2,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"list_sheets\",
      \"arguments\": {
        \"spreadsheet_id\": \"$SPREADSHEET_ID\"
      }
    }
  }"

sleep 3
echo -e "\n\n--- SSE Responses ---"
cat "$TMPFILE"

kill $SSE_PID 2>/dev/null
rm "$TMPFILE"
