# README DEV

## Claude Desktop

claude_desktop_config.json

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

## Node-RED

```bash
docker run -it -p 1880:1880 -v myNodeREDdata:/data --name mynodered nodered/node-red
```

credentials ノードの値を設定する

- slackAccessToken: "glpat-xxxxxxxxxxxxxxxxxxxx"
- gitlabPrivateToken: "Bearer xoxb-xxxxxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx"
