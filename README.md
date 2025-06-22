# Bridge Restish - MCP Server

An MCP server that bridges HTTP APIs to make them available to LLMs.

## Overview

This MCP server acts as a bridge to make your custom HTTP API server accessible to LLMs. It fetches tool definitions from your HTTP API server and dynamically registers them as MCP tools that LLMs can call.

## How it works

1. **Fetch tool definitions**: Retrieves available tool definitions from `${BASE_URL}/tools` endpoint
2. **Register MCP tools**: Dynamically registers MCP tools based on the fetched tool definitions
3. **Proxy API calls**: When LLM calls a tool, it forwards the request to the corresponding HTTP API endpoint

## HTTP API Server Requirements

Your HTTP API server should implement the following specification:

### Tool Definition Endpoint

`GET ${BASE_URL}/tools` should return an array of tool definitions:

```json
[
  {
    "name": "get_time",
    "description": "Get current date and time",
    "schema": { "type": "object", "properties": {}, "required": [] },
    "endpoint": "/get_time",
    "method": "get"
  }
]
```

### Tool Execution Endpoints

Each tool is executed via its specified endpoint and method:
- `GET ${BASE_URL}/get_time` → Returns current time as JSON

## Installation

```bash
npm install @high-u/mcp-server-bridge-restish
```

## Usage

### 1. Start your HTTP API server

First, implement and start your HTTP API server following the specification above.

### 2. Start the MCP server

```bash
# Using environment variables
export BASE_URL="http://localhost:3000"
export API_KEY="your-api-key"  # optional
mcp-server-bridge-restish

# Or using command line arguments
mcp-server-bridge-restish http://localhost:3000 your-api-key
```

### 3. Configure Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bridge-restish": {
      "command": "mcp-server-bridge-restish",
      "args": ["http://localhost:3000", "your-api-key"],
      "env": {
        "BASE_URL": "http://localhost:3000",
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## Example

If your HTTP API server provides a `get_time` tool, the LLM can call it like this:

```text
What's the current time?
```

The LLM will automatically call the `get_time` tool and retrieve the current time from your HTTP API server.

## Development

```bash
# Development mode
npm run dev

# Build
npm run build
```

## License

MIT

