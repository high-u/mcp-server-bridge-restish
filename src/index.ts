import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z, ZodTypeAny } from "zod";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const apiKey = process.argv[3] ?? "";

const server = new McpServer({
  name: "BridgeRestish",
  version: "1.0.0"
});

function jsonToZod(schema: any): ZodTypeAny {
  switch (schema.type) {
    case "object": {
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

type ToolDef = { name: string; description?: string; schema: any; endpoint: string; method: "get" | "post" };
let toolDefs: ToolDef[];
try {
  const res = await fetch(
    `${baseUrl}/tools`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  toolDefs = await res.json();
} catch (_e) {
  server.tool(
    "not_found",
    {},
    async (_args: any, _ctx: any) => ({
      content: [{ type: "text", text: "Tool definitions not available" }]
    })
  );
  toolDefs = [];
}
for (const def of toolDefs) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, propSchema] of Object.entries(def.schema.properties || {})) {
    shape[key] = jsonToZod(propSchema);
  }
  server.tool(
    def.name,
    shape,
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

server.resource(
  "dummy",
  new ResourceTemplate("dummy://{dummy}", { list: undefined }),
  async (uri, { dummy }) => ({
    contents: [{
      uri: uri.href,
      text: `${dummy}`
    }]
  })
);

(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
})();
