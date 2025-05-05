import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z, ZodTypeAny } from "zod";

// CLI でベースURLを受け取る（デフォルトは http://localhost:3000）
const baseUrl = process.argv[2] ?? "http://localhost:3000";
// CLI で API Key を受け取る（Authorization: Bearer <key>）
const apiKey = process.argv[3] ?? "";

// Create an MCP server
const server = new McpServer({
  name: "BridgeRestish",
  version: "1.0.0"
});

// JSON Schema から Zod スキーマに再帰的に変換するユーティリティ
function jsonToZod(schema: any): ZodTypeAny {
  switch (schema.type) {
    case "object": {
      // required 指定に基づき、未指定項目は optional とする
      const requiredKeys = Array.isArray(schema.required) ? schema.required : [];
      const shape: Record<string, ZodTypeAny> = {};
      for (const [key, propSchema] of Object.entries(schema.properties || {})) {
        const propZod = jsonToZod(propSchema);
        shape[key] = requiredKeys.includes(key) ? propZod : propZod.optional();
      }
      return z.object(shape);
    }
    case "string":  return z.string();
    case "number":  return z.number();
    case "boolean": return z.boolean();
    case "array":   return z.array(jsonToZod((schema as any).items));
    default:         return z.any();
  }
}

// 外部から取得したツール定義を反映
// 外部 JSON からのツール定義に description を追加
type ToolDef = { name: string; description?: string; schema: any; endpoint: string; method: "get" | "post" };
const toolDefs: ToolDef[] = await fetch(
  `${baseUrl}/tools`,
  { headers: { Authorization: `Bearer ${apiKey}` } }
)
  .then(res => res.json());
for (const def of toolDefs) {
  // JSON-Schema の properties から ZodRawShape を生成
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, propSchema] of Object.entries(def.schema.properties || {})) {
    shape[key] = jsonToZod(propSchema);
  }
  // ZodRawShape (properties) をそのまま渡す 3arg オーバーロード
  server.tool(
    def.name,                   // tool name
    shape,                      // params schema (ZodRawShape)
    {                           // annotations
      title: def.name,
      description: def.description,
    },
    async (args: any, _ctx: any) => {
      let res: Response;
      if (def.method === "get") {
        const params = new URLSearchParams();
        Object.entries(args).forEach(([k, v]) => params.append(k, String(v)));
        res = await fetch(
          `${baseUrl}${def.endpoint}?${params.toString()}`,
          { method: "GET", headers: { Authorization: `Bearer ${apiKey}` } }
        );
      } else {
        // POST: LLMから渡されたオブジェクトをそのままJSONボディに
        res = await fetch(
          `${baseUrl}${def.endpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify(args),
          }
        );
      }
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );
}

// Start receiving messages on stdin and sending messages on stdout
(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
})();
