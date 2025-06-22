# Bridge Restish - MCP Server

## Overview

This MCP server acts as a bridge to make your custom HTTP API server accessible to LLMs. It fetches tool definitions from your HTTP API server and dynamically registers them as MCP tools that LLMs can call.

## How it works

1. **Fetch tool definitions**: Retrieves available tool definitions from `${BASE_URL}/tools` endpoint
2. **Register MCP tools**: Dynamically registers MCP tools based on the fetched tool definitions
3. **Proxy API calls**: When LLM calls a tool, it forwards the request to the corresponding HTTP API endpoint

## HTTP API Server Requirements

### Description

Your HTTP API server should implement the following specification:

Run a example server for illustration purposes.

```bash
git clone https://github.com/high-u/mcp-server-bridge-restish.git
cd mcp-server-bridge-restish
node example/server.js 3000
```

### Tool Definition Endpoint

`GET ${BASE_URL}/tools` should return an array of tool definitions:

```bash
curl http://localhost:3000/tools
```

Example response:

```json
[
  {
    "name": "get_time",
    "description": "Get current date and time",
    "schema": {
      "type": "object",
      "properties": {},
      "required": []
    },
    "endpoint": "/get_time",
    "method": "get"
  },
  {
    "name": "get_birthday",
    "description": "Get a birthday for a given name",
    "schema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "The name to get birthday for"
        }
      },
      "required": [
        "name"
      ]
    },
    "endpoint": "/get_birthday",
    "method": "get"
  }
]
```

### Tool Execution Endpoints

Each tool is executed via its specified endpoint and method:

- `GET ${BASE_URL}/get_time` → Returns current time as JSON

```bash
curl http://localhost:3000/get_time
```

```json
{
  "time": "2025-06-22T03:53:49.675Z",
  "timestamp": 1750564429675
}
```

- `GET ${BASE_URL}/get_birthday?name=XXX` → Returns birthday for XXX as JSON

```bash
curl "http://localhost:3000/get_birthday?name=John"
```

```json
{
  "name": "John",
  "birthday": "1973-11-08"
}
```

The response schema is up to you. It is up to the LLM how you use it.

## Usage

### Configure Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bridge-restish": {
      "command": "mcp-server-bridge-restish",
      "args": ["http://localhost:3000", "server-api-key"],
      "env": {
        "BASE_URL": "http://localhost:3000",
        "AUTH_TYPE": "Bearer",
        "API_KEY": "server-api-key"
      }
    }
  }
}
```

“BASE_URL” is required. Set “API_KEY” and “AUTH_TYPE” as needed.

## Example User Prompt

```plain
What time is it?
```

```plain
How old is John this year?
```
