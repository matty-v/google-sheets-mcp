# Google Sheets MCP Server

An MCP (Model Context Protocol) server that provides tools for interacting with Google Sheets. Designed to run as a Google Cloud Function and proxies requests to the [sheets-db-api](../sheets-db-api).

## Features

- Full CRUD operations for sheets and rows
- Treats Google Sheets as a database with sheets as tables
- SSE transport for HTTP-based MCP communication
- No authentication required (proxies to authenticated sheets-db-api)

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_sheets` | List all sheets in the spreadsheet | `spreadsheet_id` |
| `create_sheet` | Create a new sheet | `spreadsheet_id`, `sheet_name` |
| `delete_sheet` | Delete a sheet | `spreadsheet_id`, `sheet_name` |
| `get_schema` | Get column headers | `spreadsheet_id`, `sheet_name` |
| `get_rows` | Get all rows from a sheet | `spreadsheet_id`, `sheet_name` |
| `get_row` | Get a specific row by index | `spreadsheet_id`, `sheet_name`, `row_index` |
| `create_row` | Add a new row | `spreadsheet_id`, `sheet_name`, `data` |
| `update_row` | Update an existing row | `spreadsheet_id`, `sheet_name`, `row_index`, `data` |
| `delete_row` | Delete a row | `spreadsheet_id`, `sheet_name`, `row_index` |

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Deployment

Deploy to Google Cloud Functions:

```bash
npm run deploy
```

Or manually:

```bash
gcloud functions deploy google-sheets-mcp \
  --gen2 \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=mcpHandler \
  --source=.
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SHEETS_API_URL` | URL of the sheets-db-api | `https://sheetsapi-g56q77hy2a-uc.a.run.app` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/sse` | SSE connection for MCP clients |
| POST | `/message?sessionId=xxx` | Message endpoint for MCP communication |

## Local Development

### With stdio transport (for local MCP clients)

```bash
MCP_STDIO=true npm run dev
```

### With HTTP/SSE transport

```bash
npm run dev
```

## Usage Example

Once deployed, connect your MCP client to the SSE endpoint:

```
https://YOUR_CLOUD_FUNCTION_URL/sse
```

Then use the tools with your Google Spreadsheet ID:

```json
{
  "tool": "list_sheets",
  "arguments": {
    "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  }
}
```

## Row Indexing

- Row 1 contains headers
- Data rows start at index 2
- When using `get_row`, `update_row`, or `delete_row`, use indices >= 2
