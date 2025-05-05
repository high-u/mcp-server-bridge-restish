# README

## claude

```json
{
  "mcpServers": {
    "bridge_restish": {
      "command": "node",
      "args": [
        "/Users/foobar/McpServer/bridgeRestish/dist/index.js",
        "http://localhost:1880",
        "XXXXXXXXXXX"
      ]
    }
  }
}
```

## node-red

```bash
docker run -it -p 1880:1880 -v myNodeREDdata:/data --name mynodered nodered/node-red
```
