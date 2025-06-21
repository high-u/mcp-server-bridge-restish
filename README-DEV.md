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

## npmjs

現在の設定状況:

- package.json の files フィールドで "dist" のみを指定済み（10-12行目）
- これにより、src や他のファイルは除外されます

公開に必要なコマンド:

1. バージョン更新:
npm version patch  # パッチバージョンアップ（0.1.29 → 0.1.30）
npm version minor  # マイナーバージョンアップ（0.1.29 → 0.2.0）
npm version major  # メジャーバージョンアップ（0.1.29 → 1.0.0）
2. ビルド実行:
npm run build
3. 公開:
npm publish

distファイルのみアップロードする設定は既に完了済み:

- package.json の files: ["dist"] により、distディレクトリのみが含まれます
- src、package.json、README.md等は自動で除外されます

確認方法:
npm pack --dry-run  # 実際にパッケージされるファイル一覧を確認

現在の設定で既にdistファイルのみがnpmjsにアップロードされる構成になっています。
