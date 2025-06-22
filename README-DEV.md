# README DEV

## Claude Desktop

claude_desktop_config.json

```json
{
  "mcpServers": {
    "bridge_restish": {
      "command": "node",
      "args": [
        "/Users/foobar/McpServer/bridgeRestish/dist/index.js"
      ],
      "env": {
        "BASE_URL": "http://localhost:1880",
        "API_KEY": "XXXXXXXXXXX"
      }
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

## esbuild と package.json

npx実行失敗の原因とesbuild/package.json設定解説

  問題の概要

  npx @high-u/mcp-server-bridge-restish実行時に「command not found」エラーが発生していた。

  根本原因：postinstallスクリプトの矛盾

  問題の構造

  {
    "files": ["dist"],           // npmパッケージにはdistのみ含める
    "scripts": {
      "postinstall": "npm run build",  // ❌ 問題：ビルドに必要なファイルがない
      "build": "node esbuild.config.js"
    }
  }

  npx実行フローと失敗ポイント

  1. npx実行開始
  npx @high-u/mcp-server-bridge-restish
  2. パッケージダウンロード
    - files: ["dist"]によりdist/index.jsのみダウンロード
    - src/, esbuild.config.js, tsconfig.jsonは含まれない
  3. postinstallスクリプト自動実行 ❌
  npm run build  # node esbuild.config.js
    - esbuild.config.jsが存在しない → エラー
    - または実行されてもsrc/index.tsが存在しない → ビルド失敗
  4. dist/index.jsの破損
    - ビルド失敗により既存のdist/index.jsが削除/破損
    - 結果：mcp-server-bridge-restishコマンドが見つからない

  esbuild設定の分析

  // esbuild.config.js
  await build({
    entryPoints: ['src/index.ts'],     // ソースファイル（npmパッケージに含まれない）
    bundle: true,                      // 依存関係を1ファイルにバンドル
    outfile: 'dist/index.js',         // 出力先
    format: 'esm',                     // ES Modulesとして出力
    platform: 'node',                 // Node.js環境向け
    target: 'es2020',                  // ECMAScript 2020対応
    sourcemap: true,                   // ソースマップ生成
    minify: false,                     // 圧縮しない（デバッグ用）
    external: ['effect', '@valibot/to-json-schema'], // 外部依存として扱う
    banner: {
      js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);'
    }
  })
